// GF — Tarjetas: Upload Pipeline
(function(window) {
  'use strict';

// GF — Tarjetas Upload Pipeline
// Sube Excel de transacciones + tarjetahabientes a Supabase
// Usa: XLSX (SheetJS CDN), _sb (Supabase client), TAR (tarjetas-data.js)

/** Ensure _sb is initialized before any Supabase call (retries once after delay) */
async function _ensureSupabase() {
  if (_sb) return;
  if (typeof _loadConfig === 'function') await _loadConfig();
  if (!_sb) {
    await new Promise(r => setTimeout(r, 1200));
    if (typeof _loadConfig === 'function') await _loadConfig();
  }
  if (!_sb) {
    const reason = (typeof _loadConfigError !== 'undefined' && _loadConfigError)
      ? _loadConfigError
      : 'Verifica que el servidor esté corriendo y recarga la página.';
    throw new Error('Supabase no disponible — ' + reason);
  }
}

/** Helper: call a server upload endpoint with session auth (for DELETE/UPDATE operations) */
async function _serverWriteTar(path, method, body) {
  const resp = await fetch(path, {
    method: method || 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `Server error ${resp.status} en ${path}`);
  return data;
}

const TAR_UPLOAD = {
  BATCH_SIZE: 500,
  _progress: null,

  // ═══════════════════════════════════════
  // UTILS
  // ═══════════════════════════════════════

  /** Parse Excel date: serial number or dd/mm/yyyy string → YYYY-MM-DD */
  parseDate(val) {
    if (val == null) return null;
    if (typeof val === 'number') {
      const d = new Date((val - 25569) * 86400000);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    if (typeof val === 'string') {
      const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (m) return `${m[3]}-${m[2]}-${m[1]}`;
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    }
    return null;
  },

  /** Generate UUID v4 */
  uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  },

  // ═══════════════════════════════════════
  // UPLOAD PRINCIPAL
  // ═══════════════════════════════════════

  /**
   * Upload tarjetas data from Excel file
   * @param {File} file - Excel file (.xlsx)
   * @param {string} strategy - 'replace_all' | 'replace_period' | 'append_new'
   * @param {Function} progressCb - callback(pct, msg)
   * @returns {Object} { success, txnCount, cardCount, batchId, errors }
   */
  async upload(file, strategy, progressCb) {
    this._progress = progressCb || (() => {});
    const batchId = this.uuid();
    const errors = [];

    try {
      await _ensureSupabase();
      // ── Step 1: Read file ──
      this._progress(5, 'Leyendo archivo Excel...');
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type: 'array' });

      // ── Step 2: Parse Transacciones ──
      const txnSheetName = wb.SheetNames.find(s => /transacciones/i.test(s)) || wb.SheetNames[0];
      const txnSheet = wb.Sheets[txnSheetName];
      const txnRaw = XLSX.utils.sheet_to_json(txnSheet);
      this._progress(15, `Parseando ${txnRaw.length.toLocaleString()} transacciones...`);

      const txnRows = [];
      for (let i = 0; i < txnRaw.length; i++) {
        const r = txnRaw[i];
        try {
          const fecha = this.parseDate(r['Fecha (DD/MM/AAAA)'] || r['Fecha']);
          if (!fecha) { errors.push(`Txn fila ${i + 2}: fecha inválida`); continue; }

          const tipo = r['Tipo'] || '';
          if (!tipo) { errors.push(`Txn fila ${i + 2}: tipo vacío`); continue; }

          // Parse hora: could be string "23:57:06" or Excel time serial
          let hora = null;
          const horaVal = r['Hora'];
          if (horaVal != null) {
            if (typeof horaVal === 'number') {
              // Excel time serial (fraction of day)
              const totalSecs = Math.round(horaVal * 86400);
              const h = Math.floor(totalSecs / 3600);
              const m = Math.floor((totalSecs % 3600) / 60);
              const s = totalSecs % 60;
              hora = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
            } else if (typeof horaVal === 'string' && /^\d{1,2}:\d{2}/.test(horaVal)) {
              hora = horaVal;
            }
          }

          txnRows.push({
            upload_batch: batchId,
            excel_id: String(r['ID'] || '').trim(),
            id_interno: String(r['ID Interno'] || '').trim(),
            id_operacion: String(r['ID Operación'] || r['ID Operacion'] || '').trim(),
            nombre: r['Nombre'] || null,
            id_tarjeta: parseInt(r['ID tarjeta']) || null,
            tarjeta: r['Tarjeta'] || null,
            cliente: r['Cliente'] || null,
            subcliente: r['Subcliente'] || null,
            email: r['Correo electrónico'] || r['Correo electronico'] || null,
            fecha: fecha,
            hora: hora,
            tipo: tipo,
            concepto: r['Concepto'] || null,
            descripcion: r['Descripción'] || r['Descripcion'] || null,
            observaciones: r['Observaciones'] || null,
            monto: parseFloat(r['Monto']) || 0,
            mes: fecha.substring(0, 7)
          });
        } catch (rowErr) {
          errors.push(`Txn fila ${i + 2}: ${rowErr.message}`);
        }
      }

      // ── Step 3: Parse Tarjetahabientes ──
      let cardRows = [];
      const cardSheetName = wb.SheetNames.find(s => /tarjetahabientes/i.test(s));
      if (cardSheetName) {
        this._progress(25, 'Parseando tarjetahabientes...');
        const cardSheet = wb.Sheets[cardSheetName];
        const cardRaw = XLSX.utils.sheet_to_json(cardSheet);

        for (let i = 0; i < cardRaw.length; i++) {
          const r = cardRaw[i];
          try {
            const nombre = r['Nombre'] || '';
            if (!nombre) { errors.push(`Card fila ${i + 2}: nombre vacío`); continue; }

            cardRows.push({
              upload_batch: batchId,
              excel_id: String(r['ID'] || '').trim(),
              cliente: r['Cliente'] || null,
              nombre: nombre,
              email: r['Correo electrónico'] || r['Correo electronico'] || null,
              tarjeta: r['Tarjeta'] || null,
              estado: r['Estado'] || null,
              telefono: String(r['Teléfono'] || r['Telefono'] || '').trim() || null,
              saldo: parseFloat(r['Saldo']) || 0
            });
          } catch (rowErr) {
            errors.push(`Card fila ${i + 2}: ${rowErr.message}`);
          }
        }
      }

      this._progress(30, `${txnRows.length.toLocaleString()} txns + ${cardRows.length} tarjetahabientes listos...`);

      // ── Step 4+5: Strategy-based cleanup + register batch (via server — usa service key para DELETE) ──
      {
        const txnDates = txnRows.map(r => r.fecha).filter(Boolean).sort();
        const minDate = txnDates[0];
        const maxDate = txnDates[txnDates.length - 1];
        if (strategy === 'replace_all') this._progress(32, 'Limpiando tablas...');
        else if (strategy === 'replace_period') this._progress(32, `Limpiando período ${minDate} → ${maxDate}...`);
        else if (strategy === 'append_new' && cardRows.length > 0) this._progress(32, 'Actualizando tarjetahabientes...');
        const prepResult = await _serverWriteTar('/api/upload/tarjetas/prepare', 'POST', {
          strategy,
          minDate: strategy === 'replace_period' ? minDate : undefined,
          maxDate: strategy === 'replace_period' ? maxDate : undefined,
          batchInfo: {
            id: batchId,
            filename: file.name,
            txn_count: txnRows.length,
            card_count: cardRows.length,
            date_range_from: minDate || null,
            date_range_to: maxDate || null,
            strategy,
            uploaded_by: (typeof localStorage !== 'undefined' && localStorage.getItem('sb_client_id')) || 'unknown'
          }
        });
        if (!prepResult.success) throw new Error(prepResult.error || 'Error preparando upload en servidor');
      }

      // ── Step 6: Batch insert transactions ──
      const totalBatches = Math.ceil(txnRows.length / this.BATCH_SIZE);
      let insertedTxn = 0;

      for (let i = 0; i < txnRows.length; i += this.BATCH_SIZE) {
        const batch = txnRows.slice(i, i + this.BATCH_SIZE);
        const batchNum = Math.floor(i / this.BATCH_SIZE) + 1;
        const pct = 35 + Math.round((batchNum / totalBatches) * 45);
        this._progress(pct, `Lote ${batchNum}/${totalBatches} (${insertedTxn.toLocaleString()} txns)...`);

        const { error: insertErr } = await _sb.from('tar_transactions').insert(batch);
        if (insertErr) {
          errors.push(`Lote txn ${batchNum}: ${insertErr.message}`);
          console.error('[TAR Upload] Batch error:', insertErr);
        } else {
          insertedTxn += batch.length;
        }
      }

      // ── Step 7: Insert cardholders ──
      let insertedCards = 0;
      if (cardRows.length > 0) {
        this._progress(85, `Subiendo ${cardRows.length} tarjetahabientes...`);
        const cardBatches = Math.ceil(cardRows.length / this.BATCH_SIZE);
        for (let i = 0; i < cardRows.length; i += this.BATCH_SIZE) {
          const batch = cardRows.slice(i, i + this.BATCH_SIZE);
          const { error: insertErr } = await _sb.from('tar_cardholders').insert(batch);
          if (insertErr) {
            errors.push(`Lote cards: ${insertErr.message}`);
            console.error('[TAR Upload] Card batch error:', insertErr);
          } else {
            insertedCards += batch.length;
          }
        }
      }

      // ── Step 8: Invalidate cache ──
      this._progress(97, 'Actualizando caché...');
      TAR.invalidateAll();

      // ── Step 9: Done ──
      this._progress(100, `✅ Carga completa: ${insertedTxn.toLocaleString()} txns + ${insertedCards} tarjetahabientes`);

      return {
        success: true,
        txnCount: insertedTxn,
        cardCount: insertedCards,
        batchId: batchId,
        errors: errors,
        totalParsed: txnRows.length,
        montoTotal: txnRows.reduce((s, r) => s + (r.monto || 0), 0)
      };

    } catch (e) {
      console.error('[TAR Upload] Fatal error:', e);
      this._progress(0, '❌ Error: ' + e.message);
      return { success: false, txnCount: 0, cardCount: 0, batchId: batchId, errors: [e.message] };
    }
  },


  // ═══════════════════════════════════════
  // ROLLBACK
  // ═══════════════════════════════════════

  async rollbackBatch(batchId) {
    try {
      // DELETE via server (uses service key)
      const result = await _serverWriteTar(`/api/upload/tarjetas/batch/${encodeURIComponent(batchId)}`, 'DELETE', {});
      if (!result.success) throw new Error(result.error || 'Rollback failed');
      TAR.invalidateAll();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};


// ═══════════════════════════════════════
// UI FUNCTIONS — Called from index.html
// ═══════════════════════════════════════

/** Render the tarjetas upload view: KPIs + history */
async function rTarUpload() {
  await _ensureSupabase();
  // KPI: Total transacciones
  try {
    const { count: txnCount } = await _sb.from('tar_transactions').select('*', { count: 'exact', head: true });
    const el = document.getElementById('tar-upload-kpi-txns');
    if (el) el.textContent = (txnCount || 0).toLocaleString();

    const { data: dateMin } = await _sb.from('tar_transactions')
      .select('fecha').order('fecha', { ascending: true }).limit(1);
    const { data: dateMax } = await _sb.from('tar_transactions')
      .select('fecha').order('fecha', { ascending: false }).limit(1);
    const sub = document.getElementById('tar-upload-kpi-txns-sub');
    if (sub && dateMin?.length && dateMax?.length) {
      sub.textContent = `${dateMin[0].fecha} → ${dateMax[0].fecha}`;
    } else if (sub) {
      sub.textContent = txnCount ? 'Con datos' : 'Sin transacciones';
    }
  } catch (e) { console.warn('[TAR Upload UI] KPI txns error:', e.message); }

  // KPI: Total tarjetahabientes
  try {
    const { count: cardCount } = await _sb.from('tar_cardholders').select('*', { count: 'exact', head: true });
    const el = document.getElementById('tar-upload-kpi-cards');
    if (el) el.textContent = (cardCount || 0).toLocaleString();
    const sub = document.getElementById('tar-upload-kpi-cards-sub');
    if (sub) sub.textContent = cardCount ? 'Registrados' : 'Sin tarjetahabientes';
  } catch (e) { console.warn('[TAR Upload UI] KPI cards error:', e.message); }

  // Upload history
  try {
    const history = await TAR.getUploadHistory();
    const el = document.getElementById('tar-upload-history-tbody');
    if (!el) return;

    if (!history || history.length === 0) {
      el.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px;font-size:.75rem">No hay cargas registradas. Sube tu primer archivo arriba ⬆️</td></tr>';
      // Clear last upload KPI
      const lastEl = document.getElementById('tar-upload-kpi-last');
      if (lastEl) lastEl.textContent = '—';
      return;
    }

    // Update last upload KPI
    const last = history[0];
    const lastEl = document.getElementById('tar-upload-kpi-last');
    const lastSub = document.getElementById('tar-upload-kpi-last-sub');
    if (lastEl) {
      const d = new Date(last.created_at);
      lastEl.textContent = d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (lastSub) lastSub.textContent = last.filename || 'Archivo desconocido';

    el.innerHTML = history.map(h => {
      const d = new Date(h.created_at);
      const fecha = d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      const strategy = { replace_all: '🔄 Reemplazar', replace_period: '📅 Período', append_new: '➕ Agregar' }[h.strategy] || h.strategy || '—';
      const periodo = (h.date_range_from && h.date_range_to)
        ? `${h.date_range_from} → ${h.date_range_to}`
        : '—';
      return `<tr>
        <td style="font-size:.72rem">${fecha}</td>
        <td style="font-size:.72rem;max-width:180px;overflow:hidden;text-overflow:ellipsis">${h.filename || '—'}</td>
        <td style="font-size:.72rem">${strategy}</td>
        <td class="r" style="font-size:.72rem;font-weight:600">${(h.txn_count || 0).toLocaleString()}</td>
        <td class="r" style="font-size:.72rem;font-weight:600">${(h.card_count || 0).toLocaleString()}</td>
        <td style="font-size:.72rem">${periodo}</td>
        <td><button class="btn btn-out" style="font-size:.65rem;padding:2px 8px;color:var(--red);border-color:var(--red)" onclick="rollbackTarUpload('${h.id}')">🗑️ Deshacer</button></td>
      </tr>`;
    }).join('');
  } catch (e) { console.warn('[TAR Upload UI] History error:', e.message); }
}

/** Start tarjetas upload */
async function startTarUpload() {
  const fileInput = document.getElementById('tar-upload-file');
  const file = fileInput?.files?.[0];
  if (!file) { alert('Selecciona un archivo Excel primero'); return; }

  const strategy = document.getElementById('tar-upload-strategy')?.value || 'replace_all';

  // Show progress
  const progDiv = document.getElementById('tar-upload-progress');
  const resultDiv = document.getElementById('tar-upload-result');
  if (progDiv) progDiv.style.display = 'block';
  if (resultDiv) resultDiv.style.display = 'none';

  const result = await TAR_UPLOAD.upload(file, strategy, (pct, msg) => {
    const bar = document.getElementById('tar-upload-bar');
    const msgEl = document.getElementById('tar-upload-msg');
    if (bar) bar.style.width = pct + '%';
    if (msgEl) msgEl.textContent = msg;
  });

  // Show result
  if (resultDiv) {
    resultDiv.style.display = 'block';
    if (result.success) {
      resultDiv.style.background = 'var(--green-bg)';
      resultDiv.style.color = 'var(--green)';
      resultDiv.innerHTML = `✅ <b>${result.txnCount.toLocaleString()}</b> transacciones + <b>${result.cardCount}</b> tarjetahabientes subidos.`
        + ` Monto total: <b>$${(result.montoTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</b>`
        + (result.errors.length > 0 ? `<br>⚠️ ${result.errors.length} advertencias` : '');
    } else {
      resultDiv.style.background = 'var(--red-bg)';
      resultDiv.style.color = 'var(--red)';
      resultDiv.innerHTML = '❌ Error: ' + escapeHtml(result.errors[0] || 'Error desconocido');
    }
  }

  // Refresh KPIs + history
  rTarUpload();
}

/** Rollback a tarjetas upload batch */
async function rollbackTarUpload(batchId) {
  if (!confirm('¿Seguro que quieres deshacer esta carga? Se eliminarán todas las transacciones y tarjetahabientes de este lote.')) return;

  const result = await TAR_UPLOAD.rollbackBatch(batchId);
  if (result.success) {
    alert('✅ Carga deshecha correctamente');
    rTarUpload();
  } else {
    alert('❌ Error: ' + result.error);
  }
}

  // Expose on window
  window.TAR_UPLOAD = TAR_UPLOAD;
  window.rTarUpload = rTarUpload;
  window.startTarUpload = startTarUpload;
  window.rollbackTarUpload = rollbackTarUpload;

  // Register views
  if(typeof registerView === 'function'){
    registerView('tar_upload', function(){ return rTarUpload(); });
  }

})(window);
