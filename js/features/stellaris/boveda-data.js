// GF — Stellaris Casino: Bóveda Data Layer + Parsers
(function(window) {
  'use strict';

  var BOVEDA_KEY = 'gf_boveda';

  // ═══════════════════════════════════════
  // STORAGE
  // ═══════════════════════════════════════
  function bovedaLoad() {
    return (typeof DB !== 'undefined' && DB.get(BOVEDA_KEY)) || { arqueos: [], fondos: [], reportes: { ingresos: [], gastos: [] } };
  }
  function bovedaSave(data) {
    if (typeof DB !== 'undefined') DB.set(BOVEDA_KEY, data);
  }

  // ═══════════════════════════════════════
  // PARSER: ARQUEO BOVEDA
  // Each sheet = 1 day, 3 horizontal sections (Apertura, T1, T2)
  // Columns 0-3 = Apertura/FondoB, 5-8 = T1, 10-13 = T2
  // ═══════════════════════════════════════
  function parseArqueoExcel(workbook) {
    var arqueos = [];
    var sheetNames = workbook.SheetNames;

    for (var si = 0; si < sheetNames.length; si++) {
      var ws = workbook.Sheets[sheetNames[si]];
      var data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (data.length < 20) continue;

      // Parse fecha from row 2, col 1
      var fechaRaw = data[2] ? data[2][1] : null;
      var fecha = _parseDate(fechaRaw);
      if (!fecha) continue;

      // Parse 3 sections: cols 0-3 (apertura), 5-8 (T1), 10-13 (T2)
      var apertura = _parseArqueoSection(data, 0, 'apertura');
      var t1 = _parseArqueoSection(data, 5, 'turno1');
      var t2 = _parseArqueoSection(data, 10, 'turno2');

      // Parse Fondo B (second block starting around row 37)
      var fondoB = _parseFondoB(data);

      // T1/T2 resumen (cols 5-8 and 10-13, rows 35-52)
      var t1Resumen = _parseResumenCaja(data, 5);
      var t2Resumen = _parseResumenCaja(data, 10);

      arqueos.push({
        id: 'arq_' + fecha,
        fecha: fecha,
        apertura: apertura,
        turno1: t1,
        turno2: t2,
        fondoB: fondoB,
        resumen_t1: t1Resumen,
        resumen_t2: t2Resumen,
        uploaded_at: new Date().toISOString()
      });
    }

    return arqueos.sort(function(a, b) { return a.fecha.localeCompare(b.fecha); });
  }

  function _parseDate(val) {
    if (!val) return null;
    var s = String(val);
    // Handle Excel date serial or ISO string
    if (s.match(/^\d{4}-\d{2}-\d{2}/)) return s.slice(0, 10);
    if (s.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
      var p = s.split('/');
      return p[2] + '-' + p[0].padStart(2, '0') + '-' + p[1].padStart(2, '0');
    }
    // Try Date parse
    try {
      var d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    } catch (e) {}
    return null;
  }

  function _parseArqueoSection(data, colOffset, label) {
    var section = { label: label, responsable: '', horario: '', denominaciones_mxn: [], total_mxn: 0, denominaciones_usd: [], total_usd: 0, total_usd_mxn: 0, total: 0 };

    // Responsable: row 3
    if (data[3]) section.responsable = String(data[3][colOffset + 1] || '').trim();
    // Horario: row 4
    if (data[4]) section.horario = String(data[4][colOffset + 1] || '').trim();

    // MXN denominations: rows 11-20 (col+0=denom, col+1=tipo, col+2=cantidad, col+3=total)
    var denoms = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
    for (var i = 0; i < 10; i++) {
      var row = data[11 + i];
      if (!row) continue;
      var cant = parseFloat(row[colOffset + 2]) || 0;
      var tot = parseFloat(row[colOffset + 3]) || 0;
      section.denominaciones_mxn.push({ denom: denoms[i], cantidad: cant, total: tot });
    }
    // Total MXN: row 21
    if (data[21]) section.total_mxn = parseFloat(data[21][colOffset + 3]) || 0;

    // USD denominations: rows 25-30
    var usdDenoms = [100, 50, 20, 10, 5, 1];
    for (var j = 0; j < 6; j++) {
      var urow = data[25 + j];
      if (!urow) continue;
      var ucant = parseFloat(urow[colOffset + 2]) || 0;
      var utot = parseFloat(urow[colOffset + 3]) || 0;
      section.denominaciones_usd.push({ denom: usdDenoms[j], cantidad: ucant, total: utot });
    }
    // Total USD: row 31
    if (data[31]) section.total_usd = parseFloat(data[31][colOffset + 3]) || 0;
    // USD en pesos: row 33
    if (data[33]) section.total_usd_mxn = parseFloat(data[33][colOffset + 3]) || 0;
    // Total: row 35
    if (data[35]) section.total = parseFloat(data[35][colOffset + 3]) || 0;

    return section;
  }

  function _parseFondoB(data) {
    // Fondo B starts around row 37 in cols 0-3, same structure as apertura but for Fondo B
    var fondoB = { total_mxn: 0, total_usd: 0, total: 0 };
    // Row 58: total MXN
    if (data[58]) fondoB.total_mxn = parseFloat(data[58][3]) || 0;
    // Row 68: total USD
    if (data[68]) fondoB.total_usd = parseFloat(data[68][3]) || 0;
    // Row 72: total
    if (data[72]) fondoB.total = parseFloat(data[72][3]) || 0;
    return fondoB;
  }

  function _parseResumenCaja(data, colOffset) {
    var res = {};
    // Rows 35-52 in the T1/T2 columns
    var fields = [
      [35, 'efectivo'],
      [36, 'pagos_manuales_t1'],
      [37, 'pagos_manuales_t2'],
      [39, 'tpv_prohidro_t1'],
      [40, 'tpv_prohidro_t2'],
      [42, 'tpv_grandplay_t1'],
      [43, 'tpv_grandplay_t2'],
      [45, 'sobrantes'],
      [46, 'gastos'],
      [47, 'total_caja'],
      [48, 'fondo_operativo'],
      [49, 'wigos'],
      [50, 'sob_fal'],
      [52, 'venta_tarjetas']
    ];
    fields.forEach(function(f) {
      var row = data[f[0]];
      if (row) {
        var val = parseFloat(row[colOffset + 3]) || 0;
        // Check for string values too (some fields might be NaN)
        if (!val && row[colOffset + 3] !== undefined && row[colOffset + 3] !== null) {
          val = parseFloat(String(row[colOffset + 3]).replace(/[$,]/g, '')) || 0;
        }
        res[f[1]] = val;
      } else {
        res[f[1]] = 0;
      }
    });
    return res;
  }

  // ═══════════════════════════════════════
  // PARSER: CONTROL DE FONDO
  // Single sheet: rows=fondos, cols=dates
  // ═══════════════════════════════════════
  function parseControlFondoExcel(workbook) {
    var ws = workbook.Sheets[workbook.SheetNames[0]];
    var data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Find header row with dates (row index 1 = Excel row 2)
    // Col 0 = empty, Col 1 = "Fondo Inicial" (label), Col 2+ = actual dates
    var fechas = [];
    var headerRow = data[1] || [];
    for (var c = 2; c < headerRow.length; c++) {  // start at 2, not 3
      var val = headerRow[c];
      var f = _parseDate(val);
      if (f) fechas.push({ col: c, fecha: f, label: val });
    }

    // Fund names in column A (index 0), Fondo Inicial values in col B (index 1), dates in C+ (index 2+)
    var FUND_ROWS = {
      'Fondo A': 2, 'Fondo B': 3, 'SportBook Cajas': 4, 'SportBook Premios': 5,
      'Fondo Adrian': 6, 'Fondo Gastos': 7, 'Caja Stellaris': 8, 'TPV': 9, 'Restaurante': 10
    };

    var fondos = [];
    fechas.forEach(function(fc) {
      var entry = { fecha: fc.fecha };
      var total = 0;
      for (var name in FUND_ROWS) {
        var row = data[FUND_ROWS[name]];
        var val = row ? (parseFloat(row[fc.col]) || 0) : 0;
        entry[name.toLowerCase().replace(/\s+/g, '_')] = val;
        total += val;
      }
      entry.total = total;
      fondos.push(entry);
    });

    // Fondo Inicial values are in col B (index 1)
    var iniciales = {};
    for (var name in FUND_ROWS) {
      var row = data[FUND_ROWS[name]];
      iniciales[name.toLowerCase().replace(/\s+/g, '_')] = row ? (parseFloat(row[1]) || 0) : 0;
    }

    return { fondos: fondos, iniciales: iniciales };
  }

  // ═══════════════════════════════════════
  // PARSER: REPORTE BOVEDA (Ingresos + Gastos mensuales)
  // ═══════════════════════════════════════
  var MESES = { 'ENE': 1, 'FEB': 2, 'MAR': 3, 'ABR': 4, 'MAY': 5, 'JUN': 6, 'JUL': 7, 'AGO': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DIC': 12 };

  function parseReporteBovedaExcel(workbook) {
    var ingresos = [];
    var gastos = [];

    workbook.SheetNames.forEach(function(sheetName) {
      var prefix = sheetName.split('-')[0];
      var mesCode = sheetName.split('-')[1];
      if (!mesCode || !MESES[mesCode]) return;
      var mesNum = MESES[mesCode];

      var ws = workbook.Sheets[sheetName];
      var data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (prefix === 'I') {
        // Ingresos: rows 9+ (after header row 6)
        for (var i = 7; i < data.length; i++) {
          var row = data[i];
          if (!row || !row[1]) continue;
          var fecha = _parseDate(row[1]);
          if (!fecha) continue;
          var pesos = parseFloat(row[2]) || 0;
          var dolares = parseFloat(row[3]) || 0;
          var tc = parseFloat(row[4]) || 0;
          var cambio_dlls = parseFloat(row[5]) || 0;
          var ganancia_cambiaria = parseFloat(row[6]) || 0;
          var otros_ingresos = parseFloat(row[7]) || 0;
          var total_efectivo = parseFloat(row[8]) || 0;
          var terminales = parseFloat(row[9]) || 0;
          var importe_total = parseFloat(row[10]) || 0;

          if (importe_total > 0 || total_efectivo > 0 || pesos > 0) {
            ingresos.push({
              mes: mesNum, fecha: fecha, pesos: pesos, dolares: dolares, tc: tc,
              cambio_dlls: cambio_dlls, ganancia_cambiaria: ganancia_cambiaria,
              otros_ingresos: otros_ingresos, total_efectivo: total_efectivo,
              terminales_bancarias: terminales, importe_total: importe_total
            });
          }
        }
      } else if (prefix === 'G') {
        // Gastos: rows 5+ (after header row 4)
        for (var j = 5; j < data.length; j++) {
          var grow = data[j];
          if (!grow || !grow[0]) continue;
          var gfecha = _parseDate(grow[0]);
          if (!gfecha) continue;
          var importe = parseFloat(grow[6]) || 0;
          if (importe > 0) {
            gastos.push({
              mes: mesNum, fecha: gfecha,
              no_factura: String(grow[1] || ''),
              proveedor: String(grow[2] || ''),
              concepto: String(grow[3] || ''),
              dlls: parseFloat(grow[4]) || 0,
              tc: parseFloat(grow[5]) || 0,
              importe_mn: importe,
              solicita: String(grow[7] || ''),
              entrega: String(grow[8] || '')
            });
          }
        }
      }
    });

    return { ingresos: ingresos, gastos: gastos };
  }

  // ═══════════════════════════════════════
  // DETECTOR: Tipo de Excel de Bóveda
  // ═══════════════════════════════════════
  function detectBovedaExcelType(workbook) {
    var names = workbook.SheetNames;
    // Reporte: has I-ENE, G-ENE, RESUMEN
    if (names.some(function(n) { return n.startsWith('I-'); }) && names.some(function(n) { return n.startsWith('G-'); })) return 'reporte';
    // Arqueo: has numbered sheets (1,2,3...) with STELLARIS Casino
    if (names.includes('1') || names.includes('2')) {
      var ws = workbook.Sheets[names[0]];
      var d = XLSX.utils.sheet_to_json(ws, { header: 1 });
      var text = (d[0] || []).join(' ');
      if (text.toLowerCase().includes('stellaris')) return 'arqueo';
    }
    // Control de Fondo: has "Fondo Inicial" in data
    var ws0 = workbook.Sheets[names[0]];
    var d0 = XLSX.utils.sheet_to_json(ws0, { header: 1 });
    for (var i = 0; i < Math.min(5, d0.length); i++) {
      var rowStr = (d0[i] || []).join(' ');
      if (rowStr.includes('Fondo Inicial') || rowStr.includes('Fondo A')) return 'control_fondo';
    }
    return 'unknown';
  }

  // ═══════════════════════════════════════
  // KPIS
  // ═══════════════════════════════════════
  function bovedaKPIs(fecha) {
    var data = bovedaLoad();
    var arq = fecha ? data.arqueos.find(function(a) { return a.fecha === fecha; }) : (data.arqueos.length ? data.arqueos[data.arqueos.length - 1] : null);
    var fondoEntry = fecha ? data.fondos.find(function(f) { return f.fecha === fecha; }) : (data.fondos.length ? data.fondos[data.fondos.length - 1] : null);

    var kpis = {
      fecha: arq ? arq.fecha : (fondoEntry ? fondoEntry.fecha : null),
      // Arqueo
      efectivo_apertura: arq ? arq.apertura.total : 0,
      efectivo_t1: arq ? arq.turno1.total : 0,
      efectivo_t2: arq ? arq.turno2.total : 0,
      fondoB: arq ? arq.fondoB.total : 0,
      // Resumen T2 (cierre)
      total_caja: arq && arq.resumen_t2 ? arq.resumen_t2.total_caja : 0,
      fondo_operativo: arq && arq.resumen_t2 ? arq.resumen_t2.fondo_operativo : 0,
      wigos: arq && arq.resumen_t2 ? arq.resumen_t2.wigos : 0,
      sob_fal_t1: arq && arq.resumen_t1 ? arq.resumen_t1.sob_fal : 0,
      sob_fal_t2: arq && arq.resumen_t2 ? arq.resumen_t2.sob_fal : 0,
      sob_fal_total: (arq && arq.resumen_t1 ? arq.resumen_t1.sob_fal : 0) + (arq && arq.resumen_t2 ? arq.resumen_t2.sob_fal : 0),
      tpv_prohidro: arq && arq.resumen_t2 ? (arq.resumen_t2.tpv_prohidro_t1 || 0) + (arq.resumen_t2.tpv_prohidro_t2 || 0) : 0,
      tpv_grandplay: arq && arq.resumen_t2 ? (arq.resumen_t2.tpv_grandplay_t1 || 0) + (arq.resumen_t2.tpv_grandplay_t2 || 0) : 0,
      // Fondos
      fondos: fondoEntry || null,
      caja_stellaris: fondoEntry ? fondoEntry.caja_stellaris : 0,
      tpv_acumulado: fondoEntry ? fondoEntry.tpv : 0,
      restaurante: fondoEntry ? fondoEntry.restaurante : 0,
      total_fondos: fondoEntry ? fondoEntry.total : 0,
    };

    // Ingresos/gastos del mes
    if (kpis.fecha) {
      var mesPrefix = kpis.fecha.slice(0, 7);
      kpis.ingresos_mes = data.reportes.ingresos.filter(function(r) { return r.fecha.startsWith(mesPrefix); }).reduce(function(s, r) { return s + (r.importe_total || 0); }, 0);
      kpis.gastos_mes = data.reportes.gastos.filter(function(r) { return r.fecha.startsWith(mesPrefix); }).reduce(function(s, r) { return s + (r.importe_mn || 0); }, 0);
    } else {
      kpis.ingresos_mes = 0;
      kpis.gastos_mes = 0;
    }

    return kpis;
  }

  /** Get all arqueo dates available */
  function bovedaFechas() {
    var data = bovedaLoad();
    return data.arqueos.map(function(a) { return a.fecha; }).sort();
  }

  /** Alertas de bóveda */
  function bovedaAlertas(kpis) {
    if (!kpis || !kpis.fecha) return [];
    var alertas = [];
    var f = typeof fmt === 'function' ? fmt : function(v) { return '$' + Math.round(Math.abs(v)).toLocaleString('es-MX'); };

    if (kpis.sob_fal_t1 < 0) alertas.push({ type: 'alert', icon: '🔴', text: 'Faltante T1: ' + f(kpis.sob_fal_t1) + ' — Requiere reposicion inmediata.' });
    if (kpis.sob_fal_t2 < 0) alertas.push({ type: 'alert', icon: '🔴', text: 'Faltante T2: ' + f(kpis.sob_fal_t2) + ' — Requiere reposicion inmediata.' });
    if (kpis.sob_fal_t1 > 0) alertas.push({ type: 'info', icon: '🟡', text: 'Sobrante T1: +' + f(kpis.sob_fal_t1) + ' — Posible error de cambio a favor.' });
    if (kpis.sob_fal_t2 > 0) alertas.push({ type: 'info', icon: '🟡', text: 'Sobrante T2: +' + f(kpis.sob_fal_t2) + ' — Posible error de cambio a favor.' });
    if (kpis.sob_fal_total === 0 && (kpis.total_caja > 0)) alertas.push({ type: 'positive', icon: '✅', text: 'Cuadre perfecto — SOB/FAL = $0.' });

    if (kpis.fondos) {
      var adrianPct = kpis.fondos.fondo_adrian ? Math.round(kpis.fondos.fondo_adrian / 30000 * 100) : 0;
      if (adrianPct < 30) alertas.push({ type: 'warn', icon: '⚠️', text: 'Fondo Adrian al ' + adrianPct + '% (' + f(kpis.fondos.fondo_adrian) + ' de $30,000). Requiere reposicion.' });
      if (kpis.fondos.fondo_gastos < 10000) alertas.push({ type: 'warn', icon: '⚠️', text: 'Fondo Gastos bajo: ' + f(kpis.fondos.fondo_gastos) + '. Considerar recarga.' });
    }

    return alertas;
  }

  // ═══════════════════════════════════════
  // CLEAR ALL
  // ═══════════════════════════════════════
  function boveda_clearAll() {
    if (!confirm('¿Eliminar todos los datos de Bóveda (arqueos, fondos y reportes)?')) return;
    bovedaSave({ arqueos: [], fondos: [], reportes: { ingresos: [], gastos: [] } });
    toast('🗑 Datos de Bóveda eliminados');
    if (typeof rBovedaUpload === 'function') rBovedaUpload();
  }

  // ═══════════════════════════════════════
  // EXPOSE
  // ═══════════════════════════════════════
  window.BOVEDA_KEY = BOVEDA_KEY;
  window.bovedaLoad = bovedaLoad;
  window.bovedaSave = bovedaSave;
  window.parseArqueoExcel = parseArqueoExcel;
  window.parseControlFondoExcel = parseControlFondoExcel;
  window.parseReporteBovedaExcel = parseReporteBovedaExcel;
  window.detectBovedaExcelType = detectBovedaExcelType;
  window.bovedaKPIs = bovedaKPIs;
  window.bovedaFechas = bovedaFechas;
  window.bovedaAlertas = bovedaAlertas;
  window.boveda_clearAll = boveda_clearAll;

})(window);
