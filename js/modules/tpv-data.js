// GF — TPV Data Service
// Capa de acceso a datos: RPC wrappers + caché + offline fallback
// Usa _sb (Supabase client) expuesto desde supabase.js

const TPV = {
  _cache: {},
  _cacheTime: {},
  CACHE_TTL: 5 * 60 * 1000, // 5 minutos

  // Mapping: db_field suffix → tpv_transactions.card_type_key
  _CARD_TYPE_MAP: { tc: 'TC', td: 'TD', amex: 'Amex', ti: 'TI' },

  // ═══════════════════════════════════════
  // CORE: RPC call with caching
  // ═══════════════════════════════════════
  async _rpc(fnName, params, cacheKey) {
    // Check in-memory cache
    if (this._isCacheValid(cacheKey)) {
      console.log(`[TPV] cache hit: ${cacheKey}`);
      return this._cache[cacheKey];
    }

    // Check localStorage fallback
    const lsKey = 'tpv_cache_' + cacheKey;

    try {
      if (typeof _sb === 'undefined') throw new Error('Supabase not available');
      const { data, error } = await _sb.rpc(fnName, params || {});
      if (error) throw error;
      this._setCache(cacheKey, data, lsKey);
      return data;
    } catch (e) {
      console.warn(`[TPV] RPC ${fnName} failed:`, e.message);
      // Fallback to localStorage cache
      try {
        const cached = localStorage.getItem(lsKey);
        if (cached) {
          console.log(`[TPV] using localStorage fallback for ${cacheKey}`);
          const parsed = JSON.parse(cached);
          this._cache[cacheKey] = parsed;
          return parsed;
        }
      } catch (e2) { /* ignore parse errors */ }
      return [];
    }
  },

  _isCacheValid(key) {
    return this._cache[key] && (Date.now() - (this._cacheTime[key] || 0)) < this.CACHE_TTL;
  },

  _setCache(key, data, lsKey) {
    this._cache[key] = data;
    this._cacheTime[key] = Date.now();
    try { localStorage.setItem(lsKey || ('tpv_cache_' + key), JSON.stringify(data)); }
    catch (e) { /* localStorage full, ignore */ }
  },

  invalidateAll() {
    this._cache = {};
    this._cacheTime = {};
    // Also clear localStorage TPV cache keys
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('tpv_cache_')) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    console.log('[TPV] cache invalidated');
  },

  // ═══════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════

  /**
   * Clientes por volumen (reemplaza TPV_DG_CLIENTS / TPV_D_CLIENTS)
   * @param {string|null} from - fecha inicio (YYYY-MM-DD) o null para histórico
   * @param {string|null} to - fecha fin (YYYY-MM-DD) o null para histórico
   */
  async clientsByVolume(from, to) {
    const key = `cbv_${from || 'all'}_${to || 'all'}`;
    return this._rpc('tpv_clients_by_volume', { p_from: from, p_to: to }, key);
  },

  /**
   * Mix de comisiones por entidad (para pie charts)
   */
  async commissionMix(from, to) {
    const key = `cmx_${from || 'all'}_${to || 'all'}`;
    return this._rpc('tpv_commission_mix', { p_from: from, p_to: to }, key);
  },

  /**
   * Comisiones netas por cliente (reemplaza TPV_PAGOS monto_neto)
   * Aplica correcciones automáticas si existen cambios de tasas históricas
   */
  async clientCommissions(from, to) {
    const rawKey = `cco_${from || 'all'}_${to || 'all'}`;
    const corrKey = rawKey + '_corr';

    // Check for cached corrected data first
    if (this._isCacheValid(corrKey)) {
      console.log(`[TPV] cache hit: ${corrKey}`);
      return this._cache[corrKey];
    }

    const rawData = await this._rpc('tpv_client_commissions', { p_from: from, p_to: to }, rawKey);

    // Check for rate changes that need correction
    const changes = (typeof DB !== 'undefined' && DB.get) ? (DB.get('vmcr_tpv_rate_changes') || []) : [];
    if (!changes.length) return rawData;

    // Clone data to avoid mutating the RPC cache, then apply corrections
    const cloned = (rawData || []).map(r => ({...r}));
    const corrected = await this._applyRateCorrections(cloned, from, to, changes);
    this._setCache(corrKey, corrected);
    return corrected;
  },

  /**
   * Apply historical rate corrections to commission data.
   * When a client's rate changed mid-period, the RPC uses CURRENT rates for
   * all transactions. This function corrects the amounts for transactions that
   * occurred before the rate change using the old rate.
   *
   * Matching: rate changes store cliente as nombre.toUpperCase() but the RPC
   * returns COALESCE(nombre_display, nombre). We resolve via tpv_clients.nombre
   * to match by client_id, avoiding name display mismatches.
   *
   * Logic: correction = volume_before_change × (old_rate − current_rate) × factor_iva
   */
  async _applyRateCorrections(comData, from, to, changes) {
    if (!comData || !comData.length || !changes || !changes.length) return comData;

    try {
      // Filter relevant changes:
      // - Change before fromDate → all data in range uses new rate correctly → skip
      // - Change within or after range → RPC used new rate on old transactions → needs correction
      const relevant = changes.filter(ch => {
        if (!ch.fecha_cambio) return false;
        if (from && ch.fecha_cambio <= from) return false;
        return true;
      });

      if (!relevant.length) return comData;
      if (typeof _sb === 'undefined') return comData;

      // ── Step 1: Resolve rate change client names to client_ids ──
      // Rate changes store nombre.toUpperCase(), RPC returns nombre_display.
      // Query tpv_clients to build nombre → id mapping for correct matching.
      const changeClientNames = [...new Set(relevant.map(ch => ch.cliente))];
      const { data: allClients } = await _sb.from('tpv_clients')
        .select('id, nombre, factor_iva');

      if (!allClients || !allClients.length) return comData;

      // Map: nombre.toUpperCase() → {id, factor_iva}
      const nameToClient = {};
      allClients.forEach(c => {
        nameToClient[c.nombre.toUpperCase()] = { id: c.id, fiva: parseFloat(c.factor_iva) || 1.16 };
      });

      // Group changes by client_id (resolved from nombre)
      const byClientId = {};
      relevant.forEach(ch => {
        const resolved = nameToClient[ch.cliente];
        if (!resolved) {
          console.warn(`[TPV] Rate change for unknown client: "${ch.cliente}"`);
          return;
        }
        if (!byClientId[resolved.id]) byClientId[resolved.id] = [];
        byClientId[resolved.id].push(ch);
      });

      // Find affected client IDs that exist in comData
      const comClientIds = new Set(comData.map(r => r.client_id));
      const affectedIds = Object.keys(byClientId).map(Number).filter(id => comClientIds.has(id));

      if (!affectedIds.length) return comData;

      // ── Step 2: Fetch transactions for affected clients ──
      let query = _sb.from('tpv_transactions')
        .select('cliente_id, card_type_key, fecha, monto')
        .in('cliente_id', affectedIds)
        .limit(50000);
      if (from) query = query.gte('fecha', from);
      if (to) query = query.lte('fecha', to);

      const { data: txns, error } = await query;
      if (error) throw error;
      if (!txns || !txns.length) return comData;

      // Build factor_iva map from allClients (already fetched)
      const factorMap = {};
      allClients.forEach(c => { factorMap[c.id] = parseFloat(c.factor_iva) || 1.16; });

      // Index transactions: "clientId|cardType" → [{fecha, monto}]
      const txIdx = {};
      txns.forEach(t => {
        const k = `${t.cliente_id}|${t.card_type_key}`;
        if (!txIdx[k]) txIdx[k] = [];
        txIdx[k].push({ fecha: t.fecha, monto: parseFloat(t.monto) || 0 });
      });

      // ── Step 3: Apply corrections per client ──
      let corrCount = 0;
      for (const row of comData) {
        const clientChanges = byClientId[row.client_id];
        if (!clientChanges) continue;

        const fiva = factorMap[row.client_id] || 1.16;
        let totalCorr = 0;

        for (const ch of clientChanges) {
          // Parse entity and card_type from db_field: rate_entity_cardtype
          const m = ch.db_field.match(/^rate_(\w+)_(tc|td|amex|ti)$/);
          if (!m) continue; // skip factor_iva changes (logged but not corrected)

          const entity = m[1]; // efevoo, salem, convenia, comisionista
          const cardType = this._CARD_TYPE_MAP[m[2]] || m[2].toUpperCase();

          // Get transactions for this client + card type
          const txnKey = `${row.client_id}|${cardType}`;
          const clientTxns = txIdx[txnKey] || [];

          // Sum volume BEFORE change date (these were calculated with wrong rate)
          const volBefore = clientTxns
            .filter(t => t.fecha < ch.fecha_cambio)
            .reduce((s, t) => s + t.monto, 0);

          if (volBefore === 0) continue;

          // correction = volume × (old_rate − current_rate) × factor_iva
          const deltaRate = ch.tasa_anterior - ch.tasa_nueva;
          const corr = volBefore * deltaRate * fiva;

          // Apply to entity commission field
          const comField = `com_${entity}`;
          row[comField] = (parseFloat(row[comField]) || 0) + corr;
          totalCorr += corr;
          corrCount++;

          console.log(`[TPV] Rate correction: ${row.cliente} ${ch.campo}: vol=$${volBefore.toFixed(0)}, Δ=${(deltaRate*100).toFixed(4)}%, corr=$${corr.toFixed(2)}`);
        }

        // Update monto_neto with total correction for this client
        if (totalCorr !== 0) {
          row.monto_neto = (parseFloat(row.monto_neto) || 0) + totalCorr;
          row._rate_corrected = true;
        }
      }

      if (corrCount > 0) console.log(`[TPV] ${corrCount} rate corrections applied for ${affectedIds.length} clients`);
    } catch (e) {
      console.warn('[TPV] _applyRateCorrections error:', e.message);
    }

    return comData;
  },

  /**
   * Get stored rate changes (for UI display)
   */
  getRateChanges() {
    return (typeof DB !== 'undefined' && DB.get) ? (DB.get('vmcr_tpv_rate_changes') || []) : [];
  },

  /**
   * Resumen de agentes (reemplaza TPV_AGENTES)
   */
  async agentSummary(from, to) {
    const key = `ags_${from || 'all'}_${to || 'all'}`;
    return this._rpc('tpv_agent_summary', { p_from: from, p_to: to }, key);
  },

  /**
   * Estado de terminales (reemplaza TPV_TERMINALES)
   */
  async terminalStatus(from, to) {
    const key = `tst_${from || 'all'}_${to || 'all'}`;
    return this._rpc('tpv_terminal_status', { p_from: from, p_to: to }, key);
  },

  /**
   * Cambios de terminal (reemplaza TPV_CAMBIOS)
   */
  async terminalChanges() {
    return this._rpc('tpv_terminal_changes', {}, 'tch');
  },

  /**
   * KPIs globales para dashboard
   */
  async kpis(from, to) {
    const key = `kpi_${from || 'all'}_${to || 'all'}`;
    const data = await this._rpc('tpv_kpis', { p_from: from, p_to: to }, key);
    // kpis returns a single row
    return data && data.length > 0 ? data[0] : null;
  },

  // ═══════════════════════════════════════
  // DIRECT TABLE ACCESS (for CRUD operations)
  // ═══════════════════════════════════════

  /**
   * Get all agents
   */
  async getAgentes() {
    const key = 'agentes_list';
    if (this._isCacheValid(key)) return this._cache[key];
    try {
      const { data, error } = await _sb.from('tpv_agentes').select('*').order('nombre');
      if (error) throw error;
      this._setCache(key, data);
      return data;
    } catch (e) {
      console.warn('[TPV] getAgentes failed:', e.message);
      return [];
    }
  },

  /**
   * Upsert an agent
   */
  async saveAgente(agente) {
    try {
      let data, error;
      if (agente.id) {
        // Update existing agent by ID
        ({ data, error } = await _sb.from('tpv_agentes')
          .update({ nombre: agente.nombre, siglas: agente.siglas, pct_comision: agente.pct_comision, activo: agente.activo, updated_at: new Date().toISOString() })
          .eq('id', agente.id)
          .select());
      } else {
        // Insert new agent
        ({ data, error } = await _sb.from('tpv_agentes')
          .upsert(agente, { onConflict: 'nombre' })
          .select());
      }
      if (error) throw error;
      this.invalidateAll();
      return data;
    } catch (e) {
      console.error('[TPV] saveAgente failed:', e);
      throw e;
    }
  },

  /**
   * Get all clients with their rates
   */
  async getClients() {
    const key = 'clients_list';
    if (this._isCacheValid(key)) return this._cache[key];
    try {
      const { data, error } = await _sb.from('tpv_clients')
        .select('*, tpv_agentes(nombre, siglas)')
        .order('nombre');
      if (error) throw error;
      this._setCache(key, data);
      return data;
    } catch (e) {
      console.warn('[TPV] getClients failed:', e.message);
      return [];
    }
  },

  /**
   * Upsert a client with rates
   */
  async saveClient(client) {
    try {
      client.updated_at = new Date().toISOString();
      if (client.nombre) client.nombre = client.nombre.toUpperCase().trim();
      const { data, error } = await _sb.from('tpv_clients')
        .upsert(client, { onConflict: 'nombre' })
        .select();
      if (error) throw error;
      this.invalidateAll();
      return data;
    } catch (e) {
      console.error('[TPV] saveClient failed:', e);
      throw e;
    }
  },

  /**
   * Get MSI rates for a client
   */
  async getClientMsiRates(clientId) {
    try {
      const { data, error } = await _sb.from('tpv_client_msi_rates')
        .select('*')
        .eq('cliente_id', clientId);
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('[TPV] getClientMsiRates failed:', e.message);
      return [];
    }
  },

  /**
   * Save MSI rates for a client (bulk upsert)
   */
  async saveClientMsiRates(clientId, rates) {
    try {
      // rates = [{plazo, entity, card_type, rate}, ...]
      const rows = rates.map(r => ({ ...r, cliente_id: clientId }));
      const { error } = await _sb.from('tpv_client_msi_rates')
        .upsert(rows, { onConflict: 'cliente_id,plazo,entity,card_type' });
      if (error) throw error;
      this.invalidateAll();
    } catch (e) {
      console.error('[TPV] saveClientMsiRates failed:', e);
      throw e;
    }
  },

  /**
   * Get upload history
   */
  async getUploadHistory() {
    try {
      const { data, error } = await _sb.from('tpv_upload_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    } catch (e) {
      return [];
    }
  },

  // ═══════════════════════════════════════
  // MONTHLY P&L DATA (for Salem P&L auto-injection)
  // ═══════════════════════════════════════

  /**
   * Get cached monthly P&L data (synchronous — for fiInjectTPV)
   * @param {string} year - e.g. '2026'
   * @returns {object|null} {monthly:[12], byClient:[...], updated}
   */
  monthlyPLData(year) {
    return (typeof DB !== 'undefined' && DB.get) ? DB.get('vmcr_tpv_monthly_pl_' + year) || null : null;
  },

  /**
   * Calculate and store monthly P&L data for a given year.
   * Calls clientCommissions() for each month (12 parallel RPCs),
   * then aggregates Salem income, Promotoría cost, and agent commissions.
   *
   * @param {string} year - e.g. '2026'
   * @returns {object} {monthly:[{mes,com_salem,com_comisionista,com_agentes,total_cobrado}×12], byClient:[...], updated}
   */
  async calcMonthlyPL(year) {
    try {
      console.log(`[TPV] Calculating monthly P&L for ${year}...`);

      // 1. Build month ranges and fire 12 parallel clientCommissions calls
      const promises = [];
      for (let m = 1; m <= 12; m++) {
        const from = `${year}-${String(m).padStart(2, '0')}-01`;
        const lastDay = new Date(parseInt(year), m, 0).getDate();
        const to = `${year}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        promises.push(this.clientCommissions(from, to));
      }

      // 2. Fetch client→agent mapping and agent pct_comision
      const [monthlyResults, clients, agents] = await Promise.all([
        Promise.all(promises),
        this.getClients(),
        this.getAgentes()
      ]);

      // 3. Build agent pct map: agentId → {nombre, siglas, pct}
      const agentMap = {};
      (agents || []).forEach(a => {
        agentMap[a.id] = { nombre: a.nombre, siglas: a.siglas, pct: parseFloat(a.pct_comision) || 0 };
      });

      // 4. Build client→agent pct map: clientId → {pct, agentName}
      const clientAgentMap = {};
      (clients || []).forEach(c => {
        if (c.agente_id && agentMap[c.agente_id]) {
          clientAgentMap[c.id] = {
            pct: agentMap[c.agente_id].pct,
            agente: agentMap[c.agente_id].nombre,
            siglas: agentMap[c.agente_id].siglas
          };
        }
      });

      // 5. Aggregate per month + build per-client detail
      const monthly = [];
      const clientIdx = {}; // clientName → {client_id, agente, months:[12×{com_salem,com_comisionista,com_agentes}]}

      for (let m = 0; m < 12; m++) {
        const data = monthlyResults[m] || [];
        let mSalem = 0, mComisionista = 0, mAgentes = 0, mCobrado = 0;

        data.forEach(row => {
          const cs = parseFloat(row.com_salem) || 0;
          const cc = parseFloat(row.com_comisionista) || 0;
          const tc = parseFloat(row.total_cobrado) || 0;
          const agInfo = clientAgentMap[row.client_id];
          const ca = agInfo ? cs * agInfo.pct : 0;

          mSalem += cs;
          mComisionista += cc;
          mAgentes += ca;
          mCobrado += tc;

          // Per-client tracking
          if (!clientIdx[row.cliente]) {
            clientIdx[row.cliente] = {
              client_id: row.client_id,
              agente: agInfo ? agInfo.agente : null,
              siglas: agInfo ? agInfo.siglas : null,
              agentPct: agInfo ? agInfo.pct : 0,
              months: Array.from({ length: 12 }, () => ({ com_salem: 0, com_comisionista: 0, com_agentes: 0, total_cobrado: 0 }))
            };
          }
          clientIdx[row.cliente].months[m].com_salem += cs;
          clientIdx[row.cliente].months[m].com_comisionista += cc;
          clientIdx[row.cliente].months[m].com_agentes += ca;
          clientIdx[row.cliente].months[m].total_cobrado += tc;
        });

        monthly.push({
          mes: m + 1,
          com_salem: Math.round(mSalem * 100) / 100,
          com_comisionista: Math.round(mComisionista * 100) / 100,
          com_agentes: Math.round(mAgentes * 100) / 100,
          total_cobrado: Math.round(mCobrado * 100) / 100
        });
      }

      // 6. Convert clientIdx to sorted array
      const byClient = Object.entries(clientIdx)
        .map(([name, d]) => ({
          cliente: name,
          client_id: d.client_id,
          agente: d.agente,
          siglas: d.siglas,
          agentPct: d.agentPct,
          total_salem: d.months.reduce((s, m) => s + m.com_salem, 0),
          total_comisionista: d.months.reduce((s, m) => s + m.com_comisionista, 0),
          total_agentes: d.months.reduce((s, m) => s + m.com_agentes, 0),
          total_cobrado: d.months.reduce((s, m) => s + m.total_cobrado, 0),
          months: d.months
        }))
        .sort((a, b) => b.total_salem - a.total_salem);

      const result = { year, monthly, byClient, updated: Date.now() };

      // 7. Persist to localStorage
      if (typeof DB !== 'undefined' && DB.set) {
        DB.set('vmcr_tpv_monthly_pl_' + year, result);
      }

      console.log(`[TPV] Monthly P&L calculated: ${byClient.length} clients, ${monthly.filter(m => m.com_salem > 0).length} active months`);
      return result;
    } catch (e) {
      console.warn('[TPV] calcMonthlyPL error:', e.message);
      // Return cached data if available
      return this.monthlyPLData(year);
    }
  }
};
