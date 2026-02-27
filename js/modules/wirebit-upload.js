// ══════════════════════════════════════
// WIREBIT UPLOAD — Carga de transacciones Wirebit
// Conversión USD→MXN vía Frankfurter API
// ══════════════════════════════════════

const WB_UPLOAD = (() => {

  // ── Mapping: tx_type → concepto P&L ──
  const TX_MAP = {
    'card_deposit':            'Fees Fondeo Tarjeta CRM',
    'fiat_withdrawal_card':    'Fees Fondeo Tarjeta CRM',
    'vex':                     'Fees VEX Retail',
    'vex_ecommerce':           'Fees VEX Ecommerce',
    'withdrawal_ecommerce':    'Fees Retiros / OTC',
    'withdrawal_external':     'Fees Retiros / OTC',
    'withdrawal_card_payment': 'Fees Retiros / OTC',
  };

  // ── 1. Fetch exchange rates USD→MXN ──
  async function fetchExchangeRates(startDate, endDate) {
    // Check localStorage cache first
    const cacheKey = 'vmcr_wb_fx_rates';
    const cached = DB.get(cacheKey) || {};
    const ratesMap = cached.rates || {};
    const cachedStart = cached.startDate || '';
    const cachedEnd = cached.endDate || '';

    // If cached range covers requested range, return from cache
    if (cachedStart <= startDate && cachedEnd >= endDate && Object.keys(ratesMap).length > 0) {
      console.log('[WB] FX rates from cache');
      return ratesMap;
    }

    // Fetch from Frankfurter API
    // API returns weekday rates only; we need to fill weekends/holidays
    const url = `https://api.frankfurter.app/${startDate}..${endDate}?from=USD&to=MXN`;
    console.log('[WB] Fetching FX rates:', url);

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`FX API error: ${resp.status} ${resp.statusText}`);
    const data = await resp.json();

    // Build rates map from API response
    const apiRates = {};
    if (data.rates) {
      for (const [date, val] of Object.entries(data.rates)) {
        apiRates[date] = val.MXN;
      }
    }

    // Fill in weekends/holidays with previous business day rate
    const filled = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    let lastRate = null;

    // Find the first available rate
    const sortedDates = Object.keys(apiRates).sort();
    if (sortedDates.length > 0) lastRate = apiRates[sortedDates[0]];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      if (apiRates[key]) {
        lastRate = apiRates[key];
      }
      if (lastRate) {
        filled[key] = lastRate;
      }
    }

    // Merge with existing cache
    const mergedRates = { ...ratesMap, ...filled };
    const allDates = Object.keys(mergedRates).sort();
    DB.set(cacheKey, {
      rates: mergedRates,
      startDate: allDates[0] || startDate,
      endDate: allDates[allDates.length - 1] || endDate,
      updated: new Date().toISOString(),
      source: 'frankfurter.app'
    });

    console.log(`[WB] FX rates cached: ${Object.keys(filled).length} days`);
    return mergedRates;
  }

  // ── 2. Process Excel & convert USD→MXN ──
  async function uploadTransactions(file, progressCb) {
    if (!progressCb) progressCb = () => {};

    progressCb(5, 'Leyendo archivo Excel...');

    // Read Excel
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

    // Find data sheet
    const sheetName = wb.SheetNames.find(n =>
      n.toLowerCase().includes('transaction') || n.toLowerCase().includes('data')
    ) || wb.SheetNames[0];

    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
    if (!rows.length) throw new Error('El archivo no contiene datos');

    progressCb(15, `${rows.length.toLocaleString()} filas encontradas. Filtrando...`);

    // Parse and filter transactions
    const txns = [];
    for (const row of rows) {
      const txType = (row.tx_type || row.Tx_Type || '').toString().trim();
      const status = (row.tx_status || row.Tx_Status || '').toString().trim().toLowerCase();
      const feesUSD = parseFloat(row.total_fees_as_usd || row.Total_Fees_As_USD || 0);

      // Skip: no mapping, cancelled, no fees
      if (!TX_MAP[txType]) continue;
      if (status === 'cancelled') continue;
      if (!feesUSD || feesUSD <= 0) continue;

      // Parse date
      let dateVal = row.created_date || row.Created_Date || row.created_at;
      let dateStr;
      if (dateVal instanceof Date) {
        dateStr = dateVal.toISOString().slice(0, 10);
      } else {
        dateStr = new Date(dateVal).toISOString().slice(0, 10);
      }

      if (!dateStr || dateStr === 'Invalid Date') continue;

      txns.push({
        date: dateStr,
        txType,
        feesUSD,
        concepto: TX_MAP[txType],
        client: (row.client_name || row.Client_Name || '').toString().trim(),
      });
    }

    if (!txns.length) throw new Error('No se encontraron transacciones válidas con fees');

    progressCb(25, `${txns.length.toLocaleString()} transacciones válidas. Obteniendo tipos de cambio...`);

    // Get date range
    const dates = txns.map(t => t.date).sort();
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    // Fetch exchange rates
    const fxRates = await fetchExchangeRates(startDate, endDate);
    progressCb(50, 'Tipos de cambio obtenidos. Convirtiendo USD→MXN...');

    // Convert and aggregate
    const byYear = {};   // { year: { concepto: [12 monthly values] } }
    const byClient = {}; // { client: { total_usd, total_mxn, txn_count } }
    const monthlyFX = {}; // { 'YYYY-MM': { sum_rate, count } }  for avg FX per month
    let totalUSD = 0;
    let totalMXN = 0;
    let missingFX = 0;

    for (const tx of txns) {
      const rate = fxRates[tx.date];
      if (!rate) {
        // Try to find nearest previous date
        const allDates = Object.keys(fxRates).sort();
        const nearest = allDates.filter(d => d <= tx.date).pop();
        if (!nearest) { missingFX++; continue; }
        tx.rate = fxRates[nearest];
      } else {
        tx.rate = rate;
      }

      const feeMXN = tx.feesUSD * tx.rate;
      const year = tx.date.slice(0, 4);
      const month = parseInt(tx.date.slice(5, 7)) - 1; // 0-indexed
      const ym = tx.date.slice(0, 7);

      // Aggregate by year/concepto/month
      if (!byYear[year]) {
        byYear[year] = {};
        for (const concepto of Object.values(TX_MAP)) {
          if (!byYear[year][concepto]) byYear[year][concepto] = new Array(12).fill(0);
        }
      }
      byYear[year][tx.concepto][month] += feeMXN;

      // Aggregate by client
      if (!byClient[tx.client]) byClient[tx.client] = { total_usd: 0, total_mxn: 0, txn_count: 0 };
      byClient[tx.client].total_usd += tx.feesUSD;
      byClient[tx.client].total_mxn += feeMXN;
      byClient[tx.client].txn_count++;

      // Track monthly FX for display
      if (!monthlyFX[ym]) monthlyFX[ym] = { sum_rate: 0, count: 0, usd: 0, mxn: 0 };
      monthlyFX[ym].sum_rate += tx.rate;
      monthlyFX[ym].count++;
      monthlyFX[ym].usd += tx.feesUSD;
      monthlyFX[ym].mxn += feeMXN;

      totalUSD += tx.feesUSD;
      totalMXN += feeMXN;
    }

    progressCb(75, 'Guardando datos...');

    // Save per year in localStorage
    for (const [year, monthly] of Object.entries(byYear)) {
      // Round values
      for (const concepto of Object.keys(monthly)) {
        monthly[concepto] = monthly[concepto].map(v => Math.round(v));
      }

      const clientList = Object.entries(byClient)
        .map(([client, d]) => ({ client, ...d }))
        .sort((a, b) => b.total_mxn - a.total_mxn);

      DB.set(`vmcr_wb_fees_${year}`, {
        year,
        monthly,
        byClient: clientList,
        txn_count: txns.filter(t => t.date.startsWith(year)).length,
        total_usd: totalUSD,
        total_mxn: totalMXN,
        fx_source: 'frankfurter.app',
        updated: new Date().toISOString()
      });
    }

    // Save monthly summary for the upload view
    const monthlySummary = Object.entries(monthlyFX)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, d]) => ({
        period: ym,
        usd: d.usd,
        mxn: d.mxn,
        avgFX: d.sum_rate / d.count,
        txnCount: d.count
      }));

    DB.set('vmcr_wb_upload_summary', {
      monthlySummary,
      totalUSD,
      totalMXN,
      txnCount: txns.length,
      yearsProcessed: Object.keys(byYear),
      updated: new Date().toISOString()
    });

    progressCb(100, '¡Carga completa!');

    if (missingFX > 0) {
      console.warn(`[WB] ${missingFX} transacciones sin tipo de cambio disponible`);
    }

    return {
      success: true,
      txnCount: txns.length,
      totalUSD,
      totalMXN,
      yearsProcessed: Object.keys(byYear),
      missingFX,
      monthlySummary
    };
  }

  // ── 3. Render upload view ──
  function rWBUpload() {
    // Load existing summary from localStorage
    const summary = DB.get('vmcr_wb_upload_summary');

    // Update KPIs
    const kTxns = document.getElementById('wb-upload-kpi-txns');
    const kUSD = document.getElementById('wb-upload-kpi-usd');
    const kMXN = document.getElementById('wb-upload-kpi-mxn');

    if (summary) {
      kTxns.textContent = summary.txnCount.toLocaleString();
      kTxns.style.color = '#0073ea';
      document.getElementById('wb-upload-kpi-txns-sub').textContent =
        `Años: ${summary.yearsProcessed.join(', ')}`;

      kUSD.textContent = '$' + Math.round(summary.totalUSD).toLocaleString() + ' USD';
      kUSD.style.color = 'var(--green)';
      document.getElementById('wb-upload-kpi-usd-sub').textContent =
        `Actualizado: ${new Date(summary.updated).toLocaleDateString('es-MX')}`;

      kMXN.textContent = '$' + Math.round(summary.totalMXN).toLocaleString() + ' MXN';
      kMXN.style.color = 'var(--purple)';
      document.getElementById('wb-upload-kpi-mxn-sub').textContent =
        `TC prom: $${(summary.totalMXN / summary.totalUSD).toFixed(2)}`;

      // Render monthly summary table
      renderMonthlySummary(summary.monthlySummary);
    } else {
      kTxns.textContent = '—';
      kTxns.style.color = 'var(--muted)';
      document.getElementById('wb-upload-kpi-txns-sub').textContent = 'Sin datos cargados';
      kUSD.textContent = '—';
      kUSD.style.color = 'var(--muted)';
      document.getElementById('wb-upload-kpi-usd-sub').textContent = 'Sube el Excel de Wirebit';
      kMXN.textContent = '—';
      kMXN.style.color = 'var(--muted)';
      document.getElementById('wb-upload-kpi-mxn-sub').textContent = 'Conversión automática';
    }
  }

  function renderMonthlySummary(data) {
    const tbody = document.getElementById('wb-upload-summary-tbody');
    if (!tbody || !data || !data.length) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">Sin datos. Sube el Excel de transacciones Wirebit.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(row => {
      const [y, m] = row.period.split('-');
      const monthName = MO[parseInt(m) - 1] + ' ' + y;
      return `<tr>
        <td>${monthName}</td>
        <td class="r">${row.txnCount.toLocaleString()}</td>
        <td class="r">$${row.usd.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="r">$${row.avgFX.toFixed(4)}</td>
        <td class="r" style="font-weight:600">$${Math.round(row.mxn).toLocaleString()}</td>
      </tr>`;
    }).join('');

    // Add totals row
    const totUSD = data.reduce((s, r) => s + r.usd, 0);
    const totMXN = data.reduce((s, r) => s + r.mxn, 0);
    const totTxn = data.reduce((s, r) => s + r.txnCount, 0);
    const avgFX = totMXN / totUSD;
    tbody.innerHTML += `<tr class="bld" style="border-top:2px solid var(--border)">
      <td style="font-weight:700">TOTAL</td>
      <td class="r" style="font-weight:700">${totTxn.toLocaleString()}</td>
      <td class="r" style="font-weight:700">$${totUSD.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td class="r" style="font-weight:700">$${avgFX.toFixed(4)}</td>
      <td class="r" style="font-weight:700;color:var(--green)">$${Math.round(totMXN).toLocaleString()}</td>
    </tr>`;
  }

  // ── 4. Start upload (triggered by button) ──
  async function startWBUpload() {
    const fileInput = document.getElementById('wb-upload-file');
    const file = fileInput.files[0];
    if (!file) { toast('⚠️ Selecciona un archivo Excel'); return; }

    const progressDiv = document.getElementById('wb-upload-progress');
    const progressBar = document.getElementById('wb-upload-bar');
    const progressMsg = document.getElementById('wb-upload-msg');
    const resultDiv = document.getElementById('wb-upload-result');

    progressDiv.style.display = 'block';
    resultDiv.style.display = 'none';

    try {
      const result = await uploadTransactions(file, (pct, msg) => {
        progressBar.style.width = pct + '%';
        progressMsg.textContent = msg;
      });

      // Show success
      resultDiv.style.display = 'block';
      resultDiv.style.background = 'var(--green-bg)';
      resultDiv.style.color = 'var(--green)';
      resultDiv.innerHTML = `
        <div style="font-weight:600;margin-bottom:4px">✅ Carga exitosa</div>
        <div>• <b>${result.txnCount.toLocaleString()}</b> transacciones procesadas</div>
        <div>• Total fees: <b>$${result.totalUSD.toLocaleString('en', { minimumFractionDigits: 2 })} USD</b></div>
        <div>• Total convertido: <b>$${Math.round(result.totalMXN).toLocaleString()} MXN</b></div>
        <div>• TC promedio: <b>$${(result.totalMXN / result.totalUSD).toFixed(2)}</b></div>
        <div>• Años procesados: <b>${result.yearsProcessed.join(', ')}</b></div>
        ${result.missingFX ? `<div style="color:var(--orange)">⚠️ ${result.missingFX} txns sin tipo de cambio</div>` : ''}
      `;

      // Inject into P&L arrays
      if (typeof wbLoadFees === 'function') wbLoadFees();

      // Refresh KPIs and table
      rWBUpload();

      toast('✅ Wirebit: ' + result.txnCount + ' transacciones cargadas');
      fileInput.value = '';

    } catch (err) {
      resultDiv.style.display = 'block';
      resultDiv.style.background = 'rgba(235,87,87,.08)';
      resultDiv.style.color = '#eb5757';
      resultDiv.innerHTML = `<div style="font-weight:600">❌ Error</div><div>${err.message}</div>`;
      console.error('[WB Upload]', err);
      toast('❌ Error: ' + err.message);
    }
  }

  // Public API
  return { fetchExchangeRates, uploadTransactions, rWBUpload, startWBUpload, renderMonthlySummary };

})();

// Expose globally for HTML onclick and router
function rWBUpload() { WB_UPLOAD.rWBUpload(); }
function startWBUpload() { WB_UPLOAD.startWBUpload(); }
