// GF — Tarjetas Data Service
// Capa de acceso a datos: RPC wrappers + caché + offline fallback
// Usa _sb (Supabase client) expuesto desde supabase.js

const TAR = {
  _cache: {},
  _cacheTime: {},
  CACHE_TTL: 5 * 60 * 1000, // 5 minutos

  // ═══════════════════════════════════════
  // CORE: RPC call with caching
  // ═══════════════════════════════════════
  async _rpc(fnName, params, cacheKey) {
    if (this._isCacheValid(cacheKey)) {
      console.log(`[TAR] cache hit: ${cacheKey}`);
      return this._cache[cacheKey];
    }

    const lsKey = 'tar_cache_' + cacheKey;

    try {
      if (typeof _sb === 'undefined') throw new Error('Supabase not available');
      const { data, error } = await _sb.rpc(fnName, params || {});
      if (error) throw error;
      this._setCache(cacheKey, data, lsKey);
      return data;
    } catch (e) {
      console.warn(`[TAR] RPC ${fnName} failed:`, e.message);
      try {
        const cached = localStorage.getItem(lsKey);
        if (cached) {
          console.log(`[TAR] using localStorage fallback for ${cacheKey}`);
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
    try { localStorage.setItem(lsKey || ('tar_cache_' + key), JSON.stringify(data)); }
    catch (e) { /* localStorage full, ignore */ }
  },

  invalidateAll() {
    this._cache = {};
    this._cacheTime = {};
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('tar_cache_')) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    console.log('[TAR] cache invalidated');
  },

  // ═══════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════

  /** KPIs principales del dashboard */
  async dashboardKpis() {
    const data = await this._rpc('tar_dashboard_kpis', {}, 'tar_kpis');
    return data && data.length > 0 ? data[0] : null;
  },

  /** Desglose por concepto */
  async byConcepto() {
    return this._rpc('tar_by_concepto', {}, 'tar_conc');
  },

  /** Top subclientes por monto */
  async bySubcliente() {
    return this._rpc('tar_by_subcliente', {}, 'tar_sub');
  },

  /** Rechazos agrupados por razón */
  async rechazosDetail() {
    return this._rpc('tar_rechazos_detail', {}, 'tar_rec');
  },

  /** Resumen de tarjetahabientes (JSON) */
  async cardholdersSummary() {
    const data = await this._rpc('tar_cardholders_summary', {}, 'tar_ch');
    // This RPC returns a single JSON value
    if (Array.isArray(data) && data.length > 0) return data[0];
    return data || {};
  },

  /** Actividad por día de la semana */
  async activityByWeekday() {
    return this._rpc('tar_activity_by_weekday', {}, 'tar_wd');
  },

  // ═══════════════════════════════════════
  // DIRECT TABLE ACCESS
  // ═══════════════════════════════════════

  /** Get upload history */
  async getUploadHistory() {
    try {
      const { data, error } = await _sb.from('tar_upload_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('[TAR] getUploadHistory failed:', e.message);
      return [];
    }
  }
};
