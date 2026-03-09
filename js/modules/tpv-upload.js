// GF — TPV Upload Pipeline
// Sube Excel de transacciones + config de comisiones a Supabase
// Usa: XLSX (SheetJS CDN), _sb (Supabase client), TPV (tpv-data.js)

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

      // Step 4: Strategy-based cleanup
      if (strategy === 'replace_all') {
        this._progress(32, 'Limpiando tabla de transacciones...');
        const { error: delErr } = await _sb.from('tpv_transactions').delete().neq('id', 0);
        if (delErr) throw new Error('Error limpiando tabla: ' + delErr.message);
      } else if (strategy === 'replace_period' && rows.length > 0) {
        const dates = rows.map(r => r.fecha).filter(Boolean).sort();
        const minDate = dates[0];
        const maxDate = dates[dates.length - 1];
        this._progress(32, `Limpiando período ${minDate} → ${maxDate}...`);
        const { error: delErr } = await _sb.from('tpv_transactions')
          .delete()
          .gte('fecha', minDate)
          .lte('fecha', maxDate);
        if (delErr) throw new Error('Error limpiando período: ' + delErr.message);
      }
      // 'append_new' → no cleanup, just insert (duplicates handled by excel_id if needed)

      // Step 5: Register upload batch
      const dates = rows.map(r => r.fecha).filter(Boolean).sort();
      await _sb.from('tpv_upload_batches').insert({
        id: batchId,
        filename: file.name,
        row_count: rows.length,
        date_range_from: dates[0] || null,
        date_range_to: dates[dates.length - 1] || null,
        strategy: strategy,
        uploaded_by: localStorage.getItem('sb_client_id') || 'unknown'
      });

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
        }));

        // Delete stale clients not in the new file
        const newNames = new Set(clients.map(c => c.nombre));
        const { data: existingClients } = await _sb.from('tpv_clients').select('id, nombre');
        if (existingClients) {
          const staleIds = existingClients
            .filter(c => !newNames.has(c.nombre))
            .map(c => c.id);
          if (staleIds.length > 0) {
            this._progress(30, `Eliminando ${staleIds.length} clientes obsoletos...`);
            // Delete their MSI rates first (FK)
            for (let i = 0; i < staleIds.length; i += 100) {
              const batch = staleIds.slice(i, i + 100);
              await _sb.from('tpv_client_msi_rates').delete().in('cliente_id', batch);
            }
            // Delete stale clients
            for (let i = 0; i < staleIds.length; i += 100) {
              const batch = staleIds.slice(i, i + 100);
              await _sb.from('tpv_clients').delete().in('id', batch);
            }
            // Null out cliente_id references in transactions
            for (let i = 0; i < staleIds.length; i += 100) {
              const batch = staleIds.slice(i, i + 100);
              await _sb.from('tpv_transactions').update({ cliente_id: null }).in('cliente_id', batch);
            }
            console.log(`[Upload] Removed ${staleIds.length} stale clients:`, existingClients.filter(c => !newNames.has(c.nombre)).map(c => c.nombre));
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
          if (error) console.warn('[Upload] Client batch error:', error.message);
        }
        this._progress(55, `✅ ${clients.length} clientes actualizados`);

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

          for (const r of clientRows) {
            const nombre = String(r['Cliente_Norm'] || '').toUpperCase().trim();
            const clienteId = clientIdMap[nombre];
            if (!clienteId) continue;

            // Agent assignment
            if (hasAgente) {
              const siglas = String(r['Agente'] || '').toUpperCase().trim();
              const agenteId = agentSiglasMap[siglas] || null;
              if (agenteId) {
                await _sb.from('tpv_clients')
                  .update({ agente_id: agenteId })
                  .eq('id', clienteId);
              }
            }

            // MSI rates by named columns
            if (hasMSI) {
              for (const { header, plazo, entity, card_type } of msiCols) {
                const val = parseFloat(r[header]);
                if (val && val > 0) {
                  msiRatesToInsert.push({ cliente_id: clienteId, plazo, entity, card_type, rate: val });
                }
              }
            }
          }

          // Clear ALL existing MSI rates before re-inserting (removes stale data)
          this._progress(72, 'Limpiando tasas MSI anteriores...');
          await _sb.from('tpv_client_msi_rates').delete().neq('cliente_id', 0);
          console.log('[Upload] Cleared all existing MSI rates');

          // Batch insert MSI rates (fresh)
          if (msiRatesToInsert.length > 0) {
            this._progress(75, `Subiendo ${msiRatesToInsert.length} tasas MSI...`);
            for (let i = 0; i < msiRatesToInsert.length; i += 200) {
              const batch = msiRatesToInsert.slice(i, i + 200);
              const { error } = await _sb.from('tpv_client_msi_rates')
                .insert(batch);
              if (error) console.warn('[Upload] MSI rate batch error:', error.message);
            }
            this._progress(90, `✅ ${msiRatesToInsert.length} tasas MSI actualizadas`);
          } else {
            this._progress(90, '✅ Agentes asignados (sin tasas MSI en archivo)');
          }
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
          const existing = DB.get('vmcr_tpv_rate_changes') || [];
          // Remove old entries for same client+campo+fecha to avoid duplicates
          const key = rc => `${rc.cliente}|${rc.campo}|${rc.fecha_cambio}`;
          const existingKeys = new Set(rateChanges.map(key));
          const merged = [
            ...existing.filter(rc => !existingKeys.has(key(rc))),
            ...rateChanges
          ].sort((a, b) => a.fecha_cambio < b.fecha_cambio ? -1 : 1);

          DB.set('vmcr_tpv_rate_changes', merged);
          this._progress(92, `✅ ${rateChanges.length} cambios de comisión registrados`);
          console.log(`[Upload] ${rateChanges.length} rate changes stored:`, rateChanges);
        }
      }

      // ── STEP 4: Re-link transactions to clients ──
      // Sort by name length DESC so longer names match first
      // (prevents "QUESOS CHIAPAS" from stealing "QUESOS CHIAPAS 2" transactions)
      this._progress(93, 'Actualizando enlaces cliente_id en transacciones...');
      const { data: freshClients } = await _sb.from('tpv_clients').select('id, nombre');
      if (freshClients) {
        const sorted = [...freshClients].sort((a, b) => b.nombre.length - a.nombre.length);
        for (const c of sorted) {
          // Match with trailing wildcard to handle trailing whitespace in transaction data
          await _sb.from('tpv_transactions')
            .update({ cliente_id: c.id })
            .ilike('cliente', c.nombre + '%')
            .is('cliente_id', null);
        }
      }

      // Invalidate cache
      TPV.invalidateAll();
      this._progress(100, '✅ Configuración actualizada correctamente');

      return { success: true };

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
      const { error } = await _sb.from('tpv_transactions')
        .delete()
        .eq('upload_batch', batchId);
      if (error) throw error;

      await _sb.from('tpv_upload_batches')
        .delete()
        .eq('id', batchId);

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
    const { count: clientCount } = await _sb.from('tpv_clients').select('*', { count: 'exact', head: true });
    const el = document.getElementById('upload-kpi-clients');
    if (el) el.textContent = (clientCount || 0).toLocaleString();
    const sub = document.getElementById('upload-kpi-clients-sub');
    if (sub) sub.textContent = clientCount ? 'Con tasas configuradas' : 'Sin configurar';
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
      const strategy = { replace_all: '🔄 Reemplazar', replace_period: '📅 Período', append_new: '➕ Agregar' }[h.strategy] || h.strategy || '—';
      const periodo = (h.date_range_from && h.date_range_to)
        ? `${h.date_range_from} → ${h.date_range_to}`
        : '—';
      return `<tr>
        <td style="font-size:.72rem">${fecha}</td>
        <td style="font-size:.72rem;max-width:200px;overflow:hidden;text-overflow:ellipsis">${h.filename || '—'}</td>
        <td style="font-size:.72rem">${strategy}</td>
        <td class="r" style="font-size:.72rem;font-weight:600">${(h.row_count || 0).toLocaleString()}</td>
        <td style="font-size:.72rem">${periodo}</td>
        <td><button class="btn btn-out" style="font-size:.65rem;padding:2px 8px;color:var(--red);border-color:var(--red)" onclick="rollbackUpload('${h.id}')">🗑️ Deshacer</button></td>
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
      resultDiv.innerHTML = '❌ Error: ' + (result.errors[0] || 'Error desconocido');
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
      resultDiv.style.background = 'var(--green-bg)';
      resultDiv.style.color = 'var(--green)';
      resultDiv.innerHTML = '✅ Configuración actualizada correctamente (agentes, clientes y tasas MSI)';
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


// ═══════════════════════════════════════
// RESUMEN POR CLIENTE — Vista dinámica
// ═══════════════════════════════════════

let _resumenClients = null; // cached client commission data
let _resumenAllOptions = []; // all options for search filtering

/** Helper: read resumen date filters */
function _getResumenDates() {
  const from = document.getElementById('resumen-from')?.value || null;
  const to = document.getElementById('resumen-to')?.value || null;
  return { from, to };
}

/** Quick date presets for Resumen por Cliente */
function setResumenDates(period) {
  const now = new Date();
  let from, to = now.toISOString().slice(0,10);
  if (period === 'this_month') { from = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01'; }
  else if (period === 'last_month') { const d = new Date(now.getFullYear(), now.getMonth()-1, 1); from = d.toISOString().slice(0,10); to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0,10); }
  else if (period === 'last_3') { const d = new Date(now.getFullYear(), now.getMonth()-2, 1); from = d.toISOString().slice(0,10); }
  else if (period === 'all') { from = null; to = null; }
  const dfEl = document.getElementById('resumen-from'); if(dfEl) dfEl.value = from || '';
  const dtEl = document.getElementById('resumen-to'); if(dtEl) dtEl.value = to || '';
  TPV.invalidateAll();
  rTPVResumen();
}

/** Load client list into filter dropdown */
async function rTPVResumen() {
  const filterType = document.getElementById('resumen-filter-type');
  const filterValue = document.getElementById('resumen-filter-value');
  const searchEl = document.getElementById('resumen-search');
  if (!filterType || !filterValue) return;
  if (searchEl) searchEl.value = '';

  const { from, to } = _getResumenDates();

  // Update subtitle with period
  const subtitle = document.getElementById('resumen-subtitle');
  if (subtitle) {
    const periodLabel = from && to ? `${from} → ${to}` : from ? `Desde ${from}` : 'Histórico completo';
    subtitle.textContent = `Selecciona un cliente o promotor · ${periodLabel}`;
  }

  // Load commission data with date filter
  _resumenClients = await TPV.clientCommissions(from, to) || [];

  const type = filterType.value;
  _resumenAllOptions = [];
  filterValue.innerHTML = '<option value="">— Seleccionar —</option>';

  if (type === 'cliente') {
    _resumenClients.forEach(c => {
      _resumenAllOptions.push({ value: c.client_id, label: c.cliente });
      filterValue.innerHTML += `<option value="${c.client_id}">${c.cliente}</option>`;
    });
  } else {
    const { data: clients } = await _sb.from('tpv_clients').select('id, promotor').not('promotor', 'is', null);
    const promotors = [...new Set((clients || []).map(c => c.promotor).filter(Boolean))].sort();
    promotors.forEach(p => {
      _resumenAllOptions.push({ value: p, label: p });
      filterValue.innerHTML += `<option value="${p}">${p}</option>`;
    });
  }
}

/** Filter dropdown options based on search text */
function filterResumenOptions(query) {
  const filterValue = document.getElementById('resumen-filter-value');
  if (!filterValue) return;
  const q = (query || '').toLowerCase().trim();
  filterValue.innerHTML = '<option value="">— Seleccionar —</option>';
  const filtered = q ? _resumenAllOptions.filter(o => o.label.toLowerCase().includes(q)) : _resumenAllOptions;
  filtered.forEach(o => { filterValue.innerHTML += `<option value="${o.value}">${o.label}</option>`; });
  // Auto-select if only one match
  if (filtered.length === 1) { filterValue.value = filtered[0].value; rTPVResumenDetail(); }
}

/** Show detail for selected client/promotor */
async function rTPVResumenDetail() {
  const filterType = document.getElementById('resumen-filter-type')?.value;
  const filterValue = document.getElementById('resumen-filter-value')?.value;
  const kpiEl = document.getElementById('resumen-kpis');
  const detailEl = document.getElementById('resumen-detail');
  const subtitle = document.getElementById('resumen-subtitle');

  if (!filterValue) {
    if (kpiEl) kpiEl.innerHTML = '<div class="kpi-card" style="--ac:var(--muted)"><div class="kpi-val" style="color:var(--muted);font-size:.8rem">Selecciona un cliente arriba ⬆️</div></div>';
    if (detailEl) detailEl.style.display = 'none';
    return;
  }

  let clientData;
  let displayName;

  if (filterType === 'cliente') {
    clientData = (_resumenClients || []).find(c => String(c.client_id) === filterValue);
    displayName = clientData ? clientData.cliente : filterValue;
  } else {
    // Promotor: aggregate all clients with this promotor
    const { data: promClients } = await _sb.from('tpv_clients').select('id').eq('promotor', filterValue);
    const ids = (promClients || []).map(c => c.id);
    const all = (_resumenClients || []).filter(c => ids.includes(c.client_id));
    if (all.length === 0) {
      if (kpiEl) kpiEl.innerHTML = '<div class="kpi-card" style="--ac:var(--muted)"><div class="kpi-val" style="color:var(--muted);font-size:.8rem">Sin datos para este promotor</div></div>';
      if (detailEl) detailEl.style.display = 'none';
      return;
    }
    clientData = {
      cliente: filterValue,
      total_cobrado: all.reduce((s, c) => s + parseFloat(c.total_cobrado || 0), 0),
      com_efevoo: all.reduce((s, c) => s + parseFloat(c.com_efevoo || 0), 0),
      com_salem: all.reduce((s, c) => s + parseFloat(c.com_salem || 0), 0),
      com_convenia: all.reduce((s, c) => s + parseFloat(c.com_convenia || 0), 0),
      com_comisionista: all.reduce((s, c) => s + parseFloat(c.com_comisionista || 0), 0),
      monto_neto: all.reduce((s, c) => s + parseFloat(c.monto_neto || 0), 0),
    };
    displayName = filterValue + ` (${all.length} clientes)`;
  }

  if (!clientData) return;

  const { from: rFrom, to: rTo } = _getResumenDates();
  const periodLabel = rFrom && rTo ? `${rFrom} → ${rTo}` : rFrom ? `Desde ${rFrom}` : 'Histórico completo';
  if (subtitle) subtitle.textContent = `Análisis de ventas y comisiones · ${displayName} · ${periodLabel}`;

  const cobrado = parseFloat(clientData.total_cobrado) || 0;
  const comEf = parseFloat(clientData.com_efevoo) || 0;
  const comSa = parseFloat(clientData.com_salem) || 0;
  const comCo = parseFloat(clientData.com_convenia) || 0;
  const comCm = parseFloat(clientData.com_comisionista) || 0;
  const totalCom = comEf + comSa + comCo + comCm;
  const pctCom = cobrado > 0 ? (totalCom / cobrado * 100).toFixed(1) : '0.0';

  // KPIs
  if (kpiEl) kpiEl.innerHTML = `
    <div class="kpi-card" style="--ac:#0073ea">
      <div class="kpi-top"><div class="kpi-lbl">Monto de Ventas</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">💰</div></div>
      <div class="kpi-val" style="color:#0073ea">${fmtTPV(cobrado)}</div>
      <div class="kpi-d dnu">Total facturado</div>
      <div class="kbar"><div class="kfill" style="background:#0073ea;width:100%"></div></div>
    </div>
    <div class="kpi-card" style="--ac:var(--green)">
      <div class="kpi-top"><div class="kpi-lbl">Total Comisiones</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">📈</div></div>
      <div class="kpi-val" style="color:var(--green)">${fmtTPV(totalCom)}</div>
      <div class="kpi-d dup">${pctCom}% del cobrado</div>
      <div class="kbar"><div class="kfill" style="background:var(--green);width:${Math.min(parseFloat(pctCom), 100)}%"></div></div>
    </div>
    <div class="kpi-card" style="--ac:var(--purple)">
      <div class="kpi-top"><div class="kpi-lbl">Com. Efevoo</div><div class="kpi-ico" style="background:var(--purple-bg);color:var(--purple)">⚡</div></div>
      <div class="kpi-val" style="color:var(--purple)">${fmtTPV(comEf)}</div>
      <div class="kpi-d dnu">${totalCom > 0 ? (comEf / totalCom * 100).toFixed(1) : '0.0'}%</div>
      <div class="kbar"><div class="kfill" style="background:var(--purple);width:${totalCom > 0 ? (comEf / totalCom * 100) : 0}%"></div></div>
    </div>
    <div class="kpi-card" style="--ac:#0073ea">
      <div class="kpi-top"><div class="kpi-lbl">Com. Salem</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">🏦</div></div>
      <div class="kpi-val" style="color:#0073ea">${fmtTPV(comSa)}</div>
      <div class="kpi-d dnu">${totalCom > 0 ? (comSa / totalCom * 100).toFixed(1) : '0.0'}%</div>
      <div class="kbar"><div class="kfill" style="background:#0073ea;width:${totalCom > 0 ? (comSa / totalCom * 100) : 0}%"></div></div>
    </div>`;

  // Detail tables
  if (detailEl) detailEl.style.display = 'block';

  // Commission breakdown
  const comTbody = document.getElementById('resumen-com-tbody');
  if (comTbody) {
    const entities = [
      { name: 'Efevoo', val: comEf },
      { name: 'Salem', val: comSa },
      { name: 'Convenia', val: comCo },
      { name: 'Comisionista', val: comCm }
    ];
    comTbody.innerHTML = entities.map(e => {
      const pct = totalCom > 0 ? (e.val / totalCom * 100).toFixed(1) : '0.0';
      return `<tr><td class="bld">${e.name}</td><td class="mo pos">${fmtTPV(e.val)}</td><td class="mo">${pct}%</td></tr>`;
    }).join('') + `<tr><td colspan="3" style="padding:0;border:none"><div style="height:1px;background:var(--border2);margin:4px 0"></div></td></tr>
      <tr><td class="bld" style="color:var(--text)">TOTAL</td><td class="mo bld pos">${fmtTPV(totalCom)}</td><td class="mo bld">100%</td></tr>`;
  }

  // Card type breakdown - we need to fetch this from clientsByVolume for this specific client
  const cardTbody = document.getElementById('resumen-card-tbody');
  if (cardTbody && filterType === 'cliente') {
    const volData = (await TPV.clientsByVolume(rFrom, rTo) || []).find(c => String(c.client_id) === filterValue);
    if (volData) {
      const tc = parseFloat(volData.monto_tc) || 0;
      const td = parseFloat(volData.monto_td) || 0;
      const amex = parseFloat(volData.monto_amex) || 0;
      const ti = parseFloat(volData.monto_ti) || 0;
      const total = tc + td + amex + ti || 1;
      cardTbody.innerHTML = [
        { name: 'Crédito TC', val: tc },
        { name: 'Débito TD', val: td },
        { name: 'Amex', val: amex },
        { name: 'Internacional', val: ti }
      ].map(e => `<tr><td class="bld">${e.name}</td><td class="mo">${fmtTPV(e.val)}</td><td class="mo">${(e.val / total * 100).toFixed(1)}%</td></tr>`).join('');
    }
  } else if (cardTbody) {
    cardTbody.innerHTML = '<tr><td colspan="3" style="color:var(--muted);text-align:center;font-size:.72rem">Disponible solo para clientes individuales</td></tr>';
  }
}
