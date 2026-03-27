// GF — TPV: Upload Pipeline
(function(window) {
  'use strict';

// GF — TPV Upload Pipeline
// Sube Excel de transacciones + config de comisiones a Supabase
// Usa: XLSX (SheetJS CDN), _sb (Supabase client), TPV (tpv-data.js)

/** Ensure _sb is initialized before any Supabase call (retries once after delay) */
async function _ensureSupabase() {
  if (_sb) return;
  if (typeof _loadConfig === 'function') await _loadConfig();
  if (!_sb) {
    // Retry once — server may have been momentarily unavailable
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
async function _serverWrite(path, method, body) {
  // Prefer signed JWT, fallback to legacy Base64
  const jwt = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('gf_token')) || '';
  const sess = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('gf_session')) || '';
  const token = jwt || btoa(sess);
  const resp = await fetch(path, {
    method: method || 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify(body)
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `Server error ${resp.status} en ${path}`);
  return data;
}

const TPV_UPLOAD = {
  BATCH_SIZE: 500,
  _progress: null,  // callback(pct, msg)

  // ═══════════════════════════════════════
  // UTILS
  // ═══════════════════════════════════════

  /** Parse Excel date: serial number or dd/mm/yyyy string → YYYY-MM-DD */
  parseDate(val) {
    if (val == null) return null;
    if (typeof val === 'number') {
      // Excel serial: days since 1900-01-01 (with Excel's leap year bug)
      const d = new Date((val - 25569) * 86400000);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    if (typeof val === 'string') {
      const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (m) return `${m[3]}-${m[2]}-${m[1]}`;
      // Try YYYY-MM-DD already
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    }
    return null;
  },

  /** Reconstruct time from Hora, Columna1 (min), Columna2 (sec), Columna3 (AM/PM) */
  parseTime(hora, min, sec, ampm) {
    let h = parseInt(hora) || 0;
    const m = parseInt(min) || 0;
    const s = parseInt(sec) || 0;
    const period = String(ampm || '').toUpperCase().trim();

    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  /** Derive card_type_key: TC / TD / Amex / TI */
  deriveCardTypeKey(marca, tipoTarjeta, metodoPago) {
    if (!marca) return 'TC';
    if (/amex/i.test(marca)) return 'Amex';
    if (/internacional/i.test(tipoTarjeta)) return 'TI';
    if (/d[eé]bito|prepago/i.test(metodoPago)) return 'TD';
    return 'TC';
  },

  /** Extract MSI plazo from tipo_transaccion */
  extractPlazo(tipo) {
    if (!tipo) return 0;
    const m = tipo.match(/(\d+)\s*MSI/i);
    return m ? parseInt(m[1]) : 0;
  },

  /** Calculate fecha_liquidacion based on 11PM cutoff rule */
  calcFechaLiquidacion(fecha, hora) {
    if (!fecha) return null;
    if (!hora) return fecha; // If no time info, use fecha as-is
    const h = parseInt(hora.split(':')[0]) || 0;
    // If hora >= 23 (11PM), settlement is next day
    if (h >= 23) {
      const d = new Date(fecha + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() + 1);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return fecha;
  },

  /** Parse Tasa Comision string "3.30%" → 0.033 */
  parseTasa(val) {
    if (val == null) return null;
    if (typeof val === 'number') return val;
    const s = String(val).replace('%', '').trim();
    const n = parseFloat(s);
    return isNaN(n) ? null : n / 100;
  },

  /** Generate UUID v4 */
  uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  },

  // ═══════════════════════════════════════
  // UPLOAD: TRANSACCIONES
  // ═══════════════════════════════════════

  /**
   * Upload transactions from Excel file
   * @param {File} file - Excel file
   * @param {string} strategy - 'replace_all' | 'append_new' | 'replace_period'
   * @param {Function} progressCb - callback(pct, msg)
   * @returns {Object} { success, rowCount, batchId, errors }
   */
  async uploadTransactions(file, strategy, progressCb) {
    this._progress = progressCb || (() => {});
    const batchId = this.uuid();
    const errors = [];

    try {
      await _ensureSupabase();
      // Step 1: Read file
      this._progress(5, 'Leyendo archivo Excel...');
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type: 'array' });

      // Find the transactions sheet
      const sheetName = wb.SheetNames.find(s =>
        /transacciones|data/i.test(s)
      ) || wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json(ws);
      this._progress(15, `Parseando ${rawRows.length.toLocaleString()} filas...`);

      // Step 2: Build client name → ID map
      let clientMap = {};
      try {
        const { data: clients } = await _sb.from('tpv_clients').select('id, nombre');
        if (clients) {
          clients.forEach(c => {
            clientMap[c.nombre.toUpperCase()] = c.id;
          });
        }
      } catch (e) { console.warn('[Upload] Could not load client map:', e.message); }

      // Step 3: Transform rows
      this._progress(20, 'Transformando datos...');
      const rows = [];
      for (let i = 0; i < rawRows.length; i++) {
        const r = rawRows[i];
        try {
          const cliente = r['Cliente'] || '';
          const marca = r['Marca de Tarjeta'] || '';
          const metodo = r['Método de Pago'] || r['Metodo de Pago'] || '';
          const tipoTarjeta = r['Tipo de Tarjeta'] || '';
          const tipoTxn = r['Tipo de Transacción'] || r['Tipo de Transaccion'] || '';

          const fecha = this.parseDate(r['Fecha']);
          if (!fecha) { errors.push(`Fila ${i + 2}: fecha inválida`); continue; }

          const hora = this.parseTime(r['Hora'], r['Columna1'], r['Columna2'], r['Columna3']);
          const cardTypeKey = this.deriveCardTypeKey(marca, tipoTarjeta, metodo);
          const plazoMsi = this.extractPlazo(tipoTxn);
          const fechaLiq = this.calcFechaLiquidacion(fecha, hora);

          // Terminal ID: try "Terminales" column first, then "IVA Sobretasa Centumpay" (misaligned)
          const terminalId = r['Terminales'] || r['IVA Sobretasa Centumpay'] || r['Terminal'] || null;

          // Sucursal: try "Sobretasa Centumpay" (misaligned) or "Sucursal"
          const sucursal = r['Sobretasa Centumpay'] || r['Sucursal'] || null;

          // Month: derive from fecha
          const mesStr = fecha.substring(0, 7); // YYYY-MM

          const monto = parseFloat(r['Monto']) || 0;

          rows.push({
            excel_id: String(r['ID'] || ''),
            upload_batch: batchId,
            adquiriente: r['Adquiriente'] || '',
            cliente: cliente,
            cliente_id: clientMap[cliente.toUpperCase()] || null,
            marca_tarjeta: marca,
            metodo_pago: metodo,
            monto: monto,
            fecha: fecha,
            hora: hora,
            fecha_liquidacion: fechaLiq,
            tipo_transaccion: tipoTxn,
            tipo_tarjeta: tipoTarjeta,
            terminal_id: (terminalId && terminalId !== '-' && terminalId !== 'terminal') ? terminalId : null,
            mes: mesStr,
            tasa_comision_cp: this.parseTasa(r['Tasa Comisión Centumpay'] || r['Tasa Comision Centumpay']),
            monto_comision_cp: parseFloat(r['Monto Comisión Centumpay'] || r['Monto Comision Centumpay']) || null,
            iva_comision_cp: parseFloat(r['IVA Comisión Centumpay'] || r['IVA Comision Centumpay']) || null,
            card_type_key: cardTypeKey,
            plazo_msi: plazoMsi,
            sucursal: (sucursal && sucursal !== '-' && sucursal !== 'terminal') ? sucursal : null,
            modo_entrada: r['Modo de Entrada'] || null
          });
        } catch (rowErr) {
          errors.push(`Fila ${i + 2}: ${rowErr.message}`);
        }
      }

      this._progress(30, `${rows.length.toLocaleString()} filas listas. Subiendo a Supabase...`);

      // Step 4+5: Strategy-based cleanup + register batch (via server — usa service key para DELETE)
      {
        const txnDates = rows.map(r => r.fecha).filter(Boolean).sort();
        const minDate = txnDates[0];
        const maxDate = txnDates[txnDates.length - 1];
        if (strategy === 'replace_all') this._progress(32, 'Limpiando tabla de transacciones...');
        else if (strategy === 'replace_period') this._progress(32, `Limpiando período ${minDate} → ${maxDate}...`);
        const prepResult = await _serverWrite('/api/upload/tpv/prepare', 'POST', {
          strategy,
          minDate: strategy === 'replace_period' ? minDate : undefined,
          maxDate: strategy === 'replace_period' ? maxDate : undefined,
          batchInfo: {
            id: batchId,
            filename: file.name,
            row_count: rows.length,
            date_range_from: minDate || null,
            date_range_to: maxDate || null,
            strategy,
            uploaded_by: (typeof localStorage !== 'undefined' && localStorage.getItem('sb_client_id')) || 'unknown'
          }
        });
        if (!prepResult.success) throw new Error(prepResult.error || 'Error preparando upload en servidor');
      }

      // Step 6: Batch insert
      const totalBatches = Math.ceil(rows.length / this.BATCH_SIZE);
      let inserted = 0;

      for (let i = 0; i < rows.length; i += this.BATCH_SIZE) {
        const batch = rows.slice(i, i + this.BATCH_SIZE);
        const batchNum = Math.floor(i / this.BATCH_SIZE) + 1;
        const pct = 35 + Math.round((batchNum / totalBatches) * 60);
        this._progress(pct, `Lote ${batchNum}/${totalBatches} (${inserted.toLocaleString()} filas)...`);

        const { error: insertErr } = await _sb.from('tpv_transactions').insert(batch);
        if (insertErr) {
          errors.push(`Lote ${batchNum}: ${insertErr.message}`);
          console.error('[Upload] Batch error:', insertErr);
          // Continue with remaining batches
        } else {
          inserted += batch.length;
        }
      }

      // Step 7: Invalidate cache
      this._progress(97, 'Actualizando caché...');
      TPV.invalidateAll();

      // Step 8: Done
      this._progress(100, `✅ Upload completo: ${inserted.toLocaleString()} filas`);

      return {
        success: true,
        rowCount: inserted,
        batchId: batchId,
        errors: errors,
        totalParsed: rows.length,
        montoTotal: rows.reduce((s, r) => s + (r.monto || 0), 0)
      };

    } catch (e) {
      console.error('[Upload] Fatal error:', e);
      this._progress(0, '❌ Error: ' + e.message);
      return { success: false, rowCount: 0, batchId: batchId, errors: [e.message] };
    }
  },


  // ═══════════════════════════════════════
  // UPLOAD: CONFIGURACIÓN (Comisiones + Agentes)
  // ═══════════════════════════════════════

  /**
   * Upload commission config from the "Claude 3" Excel file
   * Reads: Aux_Data (client rates), Comisiones Clientes (MSI rates), Agentes
   * @param {File} file - Excel file with config sheets
   * @param {Function} progressCb
   */
  async uploadConfig(file, progressCb) {
    this._progress = progressCb || (() => {});

    try {
      await _ensureSupabase();
      this._progress(5, 'Leyendo archivo de configuración...');
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type: 'array' });

      // ── STEP 1: Upload Agentes ──
      const agSheet = wb.Sheets['Agentes'];
      if (agSheet) {
        this._progress(10, 'Subiendo agentes...');
        const agRaw = XLSX.utils.sheet_to_json(agSheet);
        // Skip first row if it's a header duplicate
        const agents = agRaw
          .filter(r => r['Agentes'] && r['Agentes'] !== 'Agentes')
          .map(r => ({
            nombre: r['Agentes'],
            siglas: r['Siglas'] || '',
            pct_comision: parseFloat(r['Comision por ventas']) || 0,
            activo: r['Agentes'] !== 'N/A'
          }));

        for (const ag of agents) {
          const { error } = await _sb.from('tpv_agentes')
            .upsert(ag, { onConflict: 'nombre' });
          if (error) console.warn('[Upload] Agent upsert error:', error.message);
        }
        this._progress(20, `✅ ${agents.length} agentes actualizados`);
      }

      // Build agent name → id map
      const { data: agentRows } = await _sb.from('tpv_agentes').select('id, nombre, siglas');
      const agentMap = {};
      const agentSiglasMap = {};
      if (agentRows) {
        agentRows.forEach(a => {
          agentMap[a.nombre.toUpperCase()] = a.id;
          agentSiglasMap[a.siglas.toUpperCase()] = a.id;
        });
      }

      // ── STEP 2: Upload Clients (unified "Clientes" sheet, fallback to "Aux_Data") ──
      const clientSheet = wb.Sheets['Clientes'] || wb.Sheets['Aux_Data'];
      if (clientSheet) {
        this._progress(25, 'Subiendo configuración de clientes...');

        // Auto-detect header row: scan rows as arrays to find the one containing 'Cliente_Norm'
        const allRowsArr = XLSX.utils.sheet_to_json(clientSheet, { header: 1 });
        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(allRowsArr.length, 10); i++) {
          if (Array.isArray(allRowsArr[i]) && allRowsArr[i].includes('Cliente_Norm')) {
            headerRowIdx = i;
            console.log(`[Upload] Found 'Cliente_Norm' header at row ${i + 1}`);
            break;
          }
        }
        let rawRows = headerRowIdx > 0
          ? XLSX.utils.sheet_to_json(clientSheet, { range: headerRowIdx })
          : XLSX.utils.sheet_to_json(clientSheet);
        console.log(`[Upload] Parsed ${rawRows.length} client rows (headerRow=${headerRowIdx + 1})`);

        // Filter valid client rows
        const clientRows = rawRows.filter(r =>
          r['Cliente_Norm'] &&
          !String(r['Cliente_Norm']).startsWith('MSI') &&
          !String(r['Cliente_Norm']).startsWith('PAGO')
        );

        const clients = clientRows.map(r => ({
          nombre: (r['Cliente_Norm'] || '').toUpperCase().trim(),
          nombre_display: r['Cliente_Display'] || r['Trans_Name'] || null,
          promotor: r['Promotor'] || 'Sin Promotor',
          entidad: r['Entidad'] || null,
          active_desde: this.parseDate(r['Active_Desde']),
          active_hasta: this.parseDate(r['Active_Hasta']),
          factor_iva: parseFloat(r['Factor_IVA']) || 1.16,
          // Contado rates
          rate_efevoo_tc: parseFloat(r['Efevoo_TC']) || 0,
          rate_efevoo_td: parseFloat(r['Efevoo_TD']) || 0,
          rate_efevoo_amex: parseFloat(r['Efevoo_Amex']) || 0,
          rate_efevoo_ti: parseFloat(r['Efevoo_TI']) || 0,
          rate_salem_tc: parseFloat(r['Salem_TC']) || 0,
          rate_salem_td: parseFloat(r['Salem_TD']) || 0,
          rate_salem_amex: parseFloat(r['Salem_Amex']) || 0,
          rate_salem_ti: parseFloat(r['Salem_TI']) || 0,
          rate_convenia_tc: parseFloat(r['Convenia_TC']) || 0,
          rate_convenia_td: parseFloat(r['Convenia_TD']) || 0,
          rate_convenia_amex: parseFloat(r['Convenia_Amex']) || 0,
          rate_convenia_ti: parseFloat(r['Convenia_TI']) || 0,
          rate_comisionista_tc: parseFloat(r['Comisionista_TC']) || 0,
          rate_comisionista_td: parseFloat(r['Comisionista_TD']) || 0,
          rate_comisionista_amex: parseFloat(r['Comisionista_Amex']) || 0,
          rate_comisionista_ti: parseFloat(r['Comisionista_TI']) || 0,
          // Agente: assign directly in upsert (agentSiglasMap populated above)
          agente_id: agentSiglasMap[String(r['Agente'] || '').toUpperCase().trim()] || null,
        }));

        // Log parsed client summary
        const withEfevoo = clients.filter(c => c.rate_efevoo_tc > 0).length;
        const withSalem = clients.filter(c => c.rate_salem_tc > 0 || c.rate_salem_tc < 0).length;
        console.log(`[Upload] Client summary: ${clients.length} total, ${withEfevoo} with Efevoo_TC, ${withSalem} with Salem_TC`);

        // Delete stale clients not in the new file
        const newNames = new Set(clients.map(c => c.nombre));
        const { data: existingClients } = await _sb.from('tpv_clients').select('id, nombre');
        if (existingClients) {
          const staleIds = existingClients
            .filter(c => !newNames.has(c.nombre))
            .map(c => c.id);
          if (staleIds.length > 0) {
            this._progress(30, `Eliminando ${staleIds.length} clientes obsoletos...`);
            // DELETE cascade via server (service key: MSI rates FK + clients + null transactions)
            await _serverWrite('/api/upload/tpv/config', 'POST', { clientsToDelete: staleIds });
            console.log(`[Upload] Removed ${staleIds.length} stale clients`);
          }
        }

        // Batch upsert clients
        const clientBatchSize = 50;
        for (let i = 0; i < clients.length; i += clientBatchSize) {
          const batch = clients.slice(i, i + clientBatchSize);
          const pct = 33 + Math.round((i / clients.length) * 22);
          this._progress(pct, `Clientes: ${i}/${clients.length}...`);
          const { error } = await _sb.from('tpv_clients')
            .upsert(batch, { onConflict: 'nombre' });
          if (error) console.warn('[Upload] Client batch error:', error.message, 'Batch:', batch.map(c => c.nombre));
        }

        // Spot-check: verify rates were saved to DB
        const { data: spotCheck } = await _sb.from('tpv_clients')
          .select('nombre, rate_efevoo_tc, rate_salem_tc')
          .gt('rate_efevoo_tc', 0);
        const { count: totalInDB } = await _sb.from('tpv_clients').select('*', { count: 'exact', head: true });
        console.log(`[Upload] Post-upsert verification: ${totalInDB} clients in DB, ${spotCheck?.length || 0} with Efevoo_TC > 0`);
        this._uploadStats = { totalParsed: clients.length, totalInDB: totalInDB || 0, withRates: spotCheck?.length || 0 };

        // Validate: warn about clients with all rates = 0
        const zeroRateClients = clients.filter(c =>
          !c.rate_efevoo_tc && !c.rate_efevoo_td && !c.rate_efevoo_amex && !c.rate_efevoo_ti &&
          !c.rate_salem_tc && !c.rate_salem_td && !c.rate_salem_amex && !c.rate_salem_ti &&
          !c.rate_convenia_tc && !c.rate_convenia_td && !c.rate_convenia_amex && !c.rate_convenia_ti &&
          !c.rate_comisionista_tc && !c.rate_comisionista_td && !c.rate_comisionista_amex && !c.rate_comisionista_ti
        );
        if (zeroRateClients.length > 0) {
          console.warn(`[Upload] ⚠️ ${zeroRateClients.length} clientes con TODAS las tasas en 0:`, zeroRateClients.map(c => c.nombre));
          this._progress(55, `⚠️ ${clients.length} clientes actualizados — ${zeroRateClients.length} sin tasas configuradas`);
          this._zeroRateClients = zeroRateClients.map(c => c.nombre);
        } else {
          this._progress(55, `✅ ${clients.length} clientes actualizados`);
          this._zeroRateClients = [];
        }

        // ── STEP 3: Agent assignment + MSI rates (from same sheet) ──
        // Requires "Agente" column (siglas) and MSI columns by name
        const hasAgente = clientRows.some(r => r['Agente']);
        const hasMSI = clientRows.some(r => r['MSI3_Efevoo_TC'] != null);

        if (hasAgente || hasMSI) {
          this._progress(58, 'Asignando agentes y procesando tasas MSI...');

          // Refresh client name → id map after upsert
          const { data: allClients } = await _sb.from('tpv_clients').select('id, nombre');
          const clientIdMap = {};
          if (allClients) allClients.forEach(c => clientIdMap[c.nombre.toUpperCase()] = c.id);

          const msiRatesToInsert = [];
          // MSI column definitions: { header, plazo, entity, card_type }
          const msiCols = [];
          for (const plazo of [3, 6, 9, 12, 18]) {
            for (const { entity, card_type } of [
              { entity: 'efevoo', card_type: 'TC' }, { entity: 'efevoo', card_type: 'Amex' },
              { entity: 'salem', card_type: 'TC' }, { entity: 'salem', card_type: 'Amex' },
              { entity: 'convenia', card_type: 'TC' }, { entity: 'convenia', card_type: 'Amex' },
              { entity: 'comisionista', card_type: 'TC' }, { entity: 'comisionista', card_type: 'Amex' }
            ]) {
              const ent = entity.charAt(0).toUpperCase() + entity.slice(1);
              msiCols.push({
                header: `MSI${plazo}_${ent}_${card_type}`,
                plazo, entity, card_type
              });
            }
          }

          // Build MSI rates list (agent assignment now included in clients upsert above)
          if (hasMSI) {
            for (const r of clientRows) {
              const nombre = String(r['Cliente_Norm'] || '').toUpperCase().trim();
              const clienteId = clientIdMap[nombre];
              if (!clienteId) continue;
              for (const { header, plazo, entity, card_type } of msiCols) {
                const val = parseFloat(r[header]);
                if (val && val > 0) {
                  msiRatesToInsert.push({ cliente_id: clienteId, plazo, entity, card_type, rate: val });
                }
              }
            }
          }

          // Replace all MSI rates via server (DELETE + INSERT, uses service key)
          this._progress(72, 'Actualizando tasas MSI...');
          await _serverWrite('/api/upload/tpv/config', 'POST', {
            replaceClients: true,
            msiRates: msiRatesToInsert
          });
          console.log('[Upload] MSI rates replaced via server:', msiRatesToInsert.length);
          this._progress(90, msiRatesToInsert.length > 0
            ? `✅ ${msiRatesToInsert.length} tasas MSI actualizadas`
            : '✅ Agentes asignados (sin tasas MSI en archivo)');
        }
      }

      // ── STEP 3.5: Rate Change History from Cambios_Comisiones ──
      const cambiosSheet = wb.Sheets['Cambios_Comisiones'];
      if (cambiosSheet) {
        this._progress(91, 'Procesando historial de cambios de comisiones...');
        const cambiosRaw = XLSX.utils.sheet_to_json(cambiosSheet, {range: 2});
        const validFields = [
          'Efevoo_TC','Efevoo_TD','Efevoo_Amex','Efevoo_TI',
          'Salem_TC','Salem_TD','Salem_Amex','Salem_TI',
          'Convenia_TC','Convenia_TD','Convenia_Amex','Convenia_TI',
          'Comisionista_TC','Comisionista_TD','Comisionista_Amex','Comisionista_TI',
          'Factor_IVA'
        ];
        const fieldToColumn = {
          'Efevoo_TC':'rate_efevoo_tc','Efevoo_TD':'rate_efevoo_td','Efevoo_Amex':'rate_efevoo_amex','Efevoo_TI':'rate_efevoo_ti',
          'Salem_TC':'rate_salem_tc','Salem_TD':'rate_salem_td','Salem_Amex':'rate_salem_amex','Salem_TI':'rate_salem_ti',
          'Convenia_TC':'rate_convenia_tc','Convenia_TD':'rate_convenia_td','Convenia_Amex':'rate_convenia_amex','Convenia_TI':'rate_convenia_ti',
          'Comisionista_TC':'rate_comisionista_tc','Comisionista_TD':'rate_comisionista_td','Comisionista_Amex':'rate_comisionista_amex','Comisionista_TI':'rate_comisionista_ti',
          'Factor_IVA':'factor_iva'
        };

        const rateChanges = [];
        for (const row of cambiosRaw) {
          const cliente = String(row['Cliente'] || '').trim();
          const fechaRaw = row['Fecha_Cambio'];
          const campo = String(row['Campo'] || '').trim();
          const anterior = parseFloat(row['Tasa_Anterior']);
          const nueva = parseFloat(row['Tasa_Nueva']);

          if (!cliente || !fechaRaw || !campo || isNaN(anterior) || isNaN(nueva)) continue;
          if (!validFields.includes(campo)) {
            console.warn(`[Upload] Campo inválido en Cambios_Comisiones: "${campo}" para ${cliente}`);
            continue;
          }

          // Validate: rates should be decimals (0.033), not percentages (3.3)
          // Auto-correct if values look like percentages (> 1 for rate fields, > 2 for Factor_IVA)
          let tasaAnt = anterior, tasaNva = nueva;
          if (campo !== 'Factor_IVA' && (tasaAnt > 1 || tasaNva > 1)) {
            console.warn(`[Upload] ⚠️ Tasas para ${cliente}/${campo} parecen ser porcentajes (${tasaAnt}, ${tasaNva}). Convirtiendo a decimales.`);
            tasaAnt = tasaAnt / 100;
            tasaNva = tasaNva / 100;
          }

          // Parse date
          let fecha = null;
          if (typeof fechaRaw === 'number') {
            // Excel serial date
            fecha = this.parseDate(fechaRaw);
          } else {
            fecha = String(fechaRaw).trim();
            // Ensure YYYY-MM-DD format
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
              const [d, m, y] = fecha.split('/');
              fecha = `${y}-${m}-${d}`;
            }
          }

          rateChanges.push({
            cliente: cliente.toUpperCase(),
            fecha_cambio: fecha,
            campo: campo,
            db_field: fieldToColumn[campo] || campo,
            tasa_anterior: tasaAnt,
            tasa_nueva: tasaNva,
            notas: String(row['Notas'] || '').trim(),
            created_at: new Date().toISOString()
          });
        }

        if (rateChanges.length > 0) {
          // Load existing history and merge
          const existing = DB.get('gf_tpv_rate_changes') || [];
          // Remove old entries for same client+campo+fecha to avoid duplicates
          const key = rc => `${rc.cliente}|${rc.campo}|${rc.fecha_cambio}`;
          const existingKeys = new Set(rateChanges.map(key));
          const merged = [
            ...existing.filter(rc => !existingKeys.has(key(rc))),
            ...rateChanges
          ].sort((a, b) => a.fecha_cambio < b.fecha_cambio ? -1 : 1);

          DB.set('gf_tpv_rate_changes', merged);
          this._progress(92, `✅ ${rateChanges.length} cambios de comisión registrados`);
          console.log(`[Upload] ${rateChanges.length} rate changes stored:`, rateChanges);
        }
      }

      // ── Register config batch + re-link transactions via server ──
      const cfgBatchId = crypto.randomUUID ? crypto.randomUUID() : 'cfg_' + Date.now();
      const clientCount = this._uploadStats ? this._uploadStats.totalParsed : 0;
      this._progress(93, 'Registrando configuración y actualizando enlaces...');
      await _serverWrite('/api/upload/tpv/config', 'POST', {
        batchInfo: {
          id: cfgBatchId,
          filename: file.name,
          row_count: clientCount,
          date_range_from: null,
          date_range_to: null,
          strategy: 'config',
          uploaded_by: (typeof localStorage !== 'undefined' && localStorage.getItem('sb_client_id')) || 'unknown'
        },
        relinkTransactions: true
      }).then(() => console.log('[Upload] Config batch + relink done'))
        .catch(e => console.warn('[Upload] Config batch/relink failed:', e.message));

      // Invalidate cache
      TPV.invalidateAll();

      // Final summary with zero-rate warning
      const zrc = this._zeroRateClients || [];
      if (zrc.length > 0) {
        this._progress(100, `⚠️ Configuración actualizada — ${zrc.length} clientes sin tasas`);
      } else {
        this._progress(100, '✅ Configuración actualizada correctamente');
      }

      return { success: true, zeroRateClients: zrc };

    } catch (e) {
      console.error('[Upload Config] Fatal error:', e);
      this._progress(0, '❌ Error: ' + e.message);
      return { success: false, error: e.message };
    }
  },


  // ═══════════════════════════════════════
  // ROLLBACK
  // ═══════════════════════════════════════

  /**
   * Rollback an upload batch
   */
  async rollbackBatch(batchId) {
    try {
      // DELETE via server (uses service key)
      const result = await _serverWrite(`/api/upload/tpv/batch/${encodeURIComponent(batchId)}`, 'DELETE', {});
      if (!result.success) throw new Error(result.error || 'Rollback failed');
      TPV.invalidateAll();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};


// ═══════════════════════════════════════
// UI FUNCTIONS — Called from index.html
// ═══════════════════════════════════════

/** Render the upload view: load KPIs + history */
async function rTPVUpload() {
  await _ensureSupabase();
  // Load KPIs
  try {
    const { count: txnCount } = await _sb.from('tpv_transactions').select('*', { count: 'exact', head: true });
    const el = document.getElementById('upload-kpi-txns');
    if (el) el.textContent = (txnCount || 0).toLocaleString();

    // Get date range
    const { data: dateRange } = await _sb.from('tpv_transactions')
      .select('fecha')
      .order('fecha', { ascending: true })
      .limit(1);
    const { data: dateRangeMax } = await _sb.from('tpv_transactions')
      .select('fecha')
      .order('fecha', { ascending: false })
      .limit(1);
    const sub = document.getElementById('upload-kpi-txns-sub');
    if (sub && dateRange?.length && dateRangeMax?.length) {
      sub.textContent = `${dateRange[0].fecha} → ${dateRangeMax[0].fecha}`;
    } else if (sub) {
      sub.textContent = txnCount ? 'Con datos' : 'Sin transacciones';
    }
  } catch (e) { console.warn('[Upload UI] KPI txns error:', e.message); }

  try {
    const { data: allClients } = await _sb.from('tpv_clients')
      .select('nombre, rate_efevoo_tc, rate_efevoo_td, rate_salem_tc, rate_salem_td, rate_convenia_tc, rate_convenia_td, rate_comisionista_tc, rate_comisionista_td');
    const clientCount = allClients ? allClients.length : 0;
    const el = document.getElementById('upload-kpi-clients');
    if (el) el.textContent = clientCount.toLocaleString();
    const sub = document.getElementById('upload-kpi-clients-sub');
    if (sub) sub.textContent = clientCount ? 'Con tasas configuradas' : 'Sin configurar';

    // Count clients with ALL rates = 0
    const noRates = allClients ? allClients.filter(c =>
      !c.rate_efevoo_tc && !c.rate_efevoo_td &&
      !c.rate_salem_tc && !c.rate_salem_td &&
      !c.rate_convenia_tc && !c.rate_convenia_td &&
      !c.rate_comisionista_tc && !c.rate_comisionista_td
    ) : [];
    const nrCard = document.getElementById('upload-kpi-noratescard');
    const nrVal = document.getElementById('upload-kpi-norates');
    const nrSub = document.getElementById('upload-kpi-norates-sub');
    if (nrCard) {
      if (noRates.length > 0) {
        nrCard.style.display = '';
        if (nrVal) nrVal.textContent = noRates.length;
        if (nrSub) nrSub.innerHTML = noRates.map(c =>
          `<span style="background:#fff3cd;padding:1px 7px;border-radius:4px;margin:2px;display:inline-block;font-size:.7rem">${c.nombre}</span>`
        ).join('');
      } else {
        nrCard.style.display = 'none';
      }
    }
  } catch (e) { console.warn('[Upload UI] KPI clients error:', e.message); }

  // Load upload history
  try {
    const history = await TPV.getUploadHistory();
    const el = document.getElementById('upload-history-tbody');
    if (!el) return;

    if (!history || history.length === 0) {
      el.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px;font-size:.75rem">No hay cargas registradas. Sube tu primer archivo arriba ⬆️</td></tr>';
      return;
    }

    // Update last upload KPI
    const last = history[0];
    const lastEl = document.getElementById('upload-kpi-last');
    const lastSub = document.getElementById('upload-kpi-last-sub');
    if (lastEl) {
      const d = new Date(last.created_at);
      lastEl.textContent = d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (lastSub) lastSub.textContent = last.filename || 'Archivo desconocido';

    el.innerHTML = history.map(h => {
      const d = new Date(h.created_at);
      const fecha = d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      const strategy = { replace_all: '🔄 Reemplazar', replace_period: '📅 Período', append_new: '➕ Agregar', config: '⚙️ Configuración' }[h.strategy] || h.strategy || '—';
      const periodo = (h.date_range_from && h.date_range_to)
        ? `${h.date_range_from} → ${h.date_range_to}`
        : '—';
      return `<tr>
        <td style="font-size:.72rem">${fecha}</td>
        <td style="font-size:.72rem;max-width:200px;overflow:hidden;text-overflow:ellipsis">${h.filename || '—'}</td>
        <td style="font-size:.72rem">${strategy}</td>
        <td class="r" style="font-size:.72rem;font-weight:600">${(h.row_count || 0).toLocaleString()}</td>
        <td style="font-size:.72rem">${periodo}</td>
        <td>${h.strategy !== 'config' ? `<button class="btn btn-out" style="font-size:.65rem;padding:2px 8px;color:var(--red);border-color:var(--red)" onclick="rollbackUpload('${h.id}')">🗑️ Deshacer</button>` : ''}</td>
      </tr>`;
    }).join('');
  } catch (e) { console.warn('[Upload UI] History error:', e.message); }
}

/** Start transaction upload */
async function startTxnUpload() {
  const fileInput = document.getElementById('upload-txn-file');
  const file = fileInput?.files?.[0];
  if (!file) { alert('Selecciona un archivo Excel primero'); return; }

  const strategy = document.getElementById('upload-txn-strategy')?.value || 'replace_all';

  // Show progress
  const progDiv = document.getElementById('upload-txn-progress');
  const resultDiv = document.getElementById('upload-txn-result');
  if (progDiv) progDiv.style.display = 'block';
  if (resultDiv) resultDiv.style.display = 'none';

  const result = await TPV_UPLOAD.uploadTransactions(file, strategy, (pct, msg) => {
    const bar = document.getElementById('upload-txn-bar');
    const msgEl = document.getElementById('upload-txn-msg');
    if (bar) bar.style.width = pct + '%';
    if (msgEl) msgEl.textContent = msg;
  });

  // Show result
  if (resultDiv) {
    resultDiv.style.display = 'block';
    if (result.success) {
      resultDiv.style.background = 'var(--green-bg)';
      resultDiv.style.color = 'var(--green)';
      resultDiv.innerHTML = `✅ <b>${result.rowCount.toLocaleString()}</b> transacciones subidas correctamente.`
        + ` Monto total: <b>$${(result.montoTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</b>`
        + (result.errors.length > 0 ? `<br>⚠️ ${result.errors.length} advertencias` : '');
    } else {
      resultDiv.style.background = 'var(--red-bg)';
      resultDiv.style.color = 'var(--red)';
      resultDiv.innerHTML = '❌ Error: ' + escapeHtml(result.errors[0] || 'Error desconocido');
    }
  }

  // Refresh KPIs + history
  rTPVUpload();

  // Recalculate monthly P&L data after successful upload
  if (result.success) {
    const year = new Date().getFullYear().toString();
    TPV.calcMonthlyPL(year).then(() => {
      console.log('[Upload] Monthly P&L data recalculated for ' + year);
    }).catch(e => console.warn('[Upload] Monthly P&L recalc failed:', e.message));
  }
}

/** Start config upload */
async function startCfgUpload() {
  const fileInput = document.getElementById('upload-cfg-file');
  const file = fileInput?.files?.[0];
  if (!file) { alert('Selecciona un archivo Excel primero'); return; }

  // Show progress
  const progDiv = document.getElementById('upload-cfg-progress');
  const resultDiv = document.getElementById('upload-cfg-result');
  if (progDiv) progDiv.style.display = 'block';
  if (resultDiv) resultDiv.style.display = 'none';

  const result = await TPV_UPLOAD.uploadConfig(file, (pct, msg) => {
    const bar = document.getElementById('upload-cfg-bar');
    const msgEl = document.getElementById('upload-cfg-msg');
    if (bar) bar.style.width = pct + '%';
    if (msgEl) msgEl.textContent = msg;
  });

  // Show result
  if (resultDiv) {
    resultDiv.style.display = 'block';
    if (result.success) {
      const zrc = result.zeroRateClients || [];
      const stats = TPV_UPLOAD._uploadStats || {};
      const summaryLine = `<div style="font-size:.72rem;margin-bottom:6px;opacity:.85">` +
        `📊 ${stats.totalParsed || '?'} clientes en Excel → ${stats.totalInDB || '?'} en BD → ${stats.withRates || '?'} con tasas Efevoo</div>`;

      if (zrc.length > 0) {
        resultDiv.style.background = '#fef3cd';
        resultDiv.style.color = '#856404';
        resultDiv.innerHTML = summaryLine +
          `⚠️ Configuración actualizada, pero <strong>${zrc.length} clientes tienen TODAS las tasas en 0</strong>:<br>` +
          `<div style="margin-top:6px;font-size:.72rem;max-height:120px;overflow-y:auto;line-height:1.6">` +
          zrc.map(n => `<span style="background:#fff3cd;padding:1px 6px;border-radius:4px;margin:2px;display:inline-block">${n}</span>`).join('') +
          `</div><div style="margin-top:8px;font-size:.72rem">Revisa tu Excel — estas filas no tienen columnas Efevoo_TC, Salem_TC, etc. con valores.</div>`;
      } else {
        resultDiv.style.background = 'var(--green-bg)';
        resultDiv.style.color = 'var(--green)';
        resultDiv.innerHTML = summaryLine + '✅ Configuración actualizada correctamente — todos los clientes tienen tasas configuradas';
      }
    } else {
      resultDiv.style.background = 'var(--red-bg)';
      resultDiv.style.color = 'var(--red)';
      resultDiv.innerHTML = '❌ Error: ' + (result.error || 'Error desconocido');
    }
  }

  // Refresh KPIs
  rTPVUpload();
}

/** Rollback an upload batch */
async function rollbackUpload(batchId) {
  if (!confirm('¿Seguro que quieres deshacer esta carga? Se eliminarán todas las transacciones de este lote.')) return;

  const result = await TPV_UPLOAD.rollbackBatch(batchId);
  if (result.success) {
    alert('✅ Carga deshecha correctamente');
    rTPVUpload();
  } else {
    alert('❌ Error: ' + result.error);
  }
}

  // Expose on window
  window._ensureSupabase = _ensureSupabase;
  window.TPV_UPLOAD = TPV_UPLOAD;
  window.rTPVUpload = rTPVUpload;
  window.startTxnUpload = startTxnUpload;
  window.startCfgUpload = startCfgUpload;
  window.rollbackUpload = rollbackUpload;

  // Register views
  if(typeof registerView === 'function'){
    registerView('tpv_upload', function(){ return rTPVUpload(); });
  }

})(window);
