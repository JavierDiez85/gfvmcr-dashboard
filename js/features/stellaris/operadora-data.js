// GF — Stellaris: Operadora — Data Layer
// Parsers para: Reporte Fiscal (mensual) y Sesiones de Caja (diario)
(function(window) {
  'use strict';

  var OPERADORA_KEY = 'gf_operadora';

  // ── STORAGE ──────────────────────────────────────────────────
  function operadoraLoad() {
    try {
      var d = (typeof DB !== 'undefined' && DB.get) ? DB.get(OPERADORA_KEY) : null;
      if (d && (d.reportes || d.sesiones)) return d;
    } catch(e) {}
    return { reportes: [], sesiones: [] };
  }

  function operadora_save(data) {
    if (typeof DB !== 'undefined' && DB.set) DB.set(OPERADORA_KEY, data);
  }

  // ── DETECT FILE TYPE ─────────────────────────────────────────
  // Fiscal:   tiene hoja "REPORTE MAQUINAS 100%" o "REPORTE OPERADORA"
  // Sesiones: alguna fila entre 0-9 contiene "usuario" en cualquier celda
  function detectOperadoraTipo(workbook) {
    if (!workbook || !workbook.SheetNames) return null;
    var names = workbook.SheetNames.map(function(n){ return n.trim().toUpperCase(); });
    if (names.some(function(n){ return n.indexOf('REPORTE') !== -1 && (n.indexOf('MAQUINA') !== -1 || n.indexOf('OPERADORA') !== -1); })) {
      return 'fiscal';
    }
    // Sesiones: scan first 12 rows for any cell containing "usuario"
    var s1 = workbook.Sheets[workbook.SheetNames[0]];
    if (s1) {
      var raw = XLSX.utils.sheet_to_json(s1, { header: 1, defval: null });
      for (var ri = 0; ri < Math.min(12, raw.length); ri++) {
        var row = raw[ri] || [];
        for (var ci = 0; ci < Math.min(10, row.length); ci++) {
          if (row[ci] && String(row[ci]).toLowerCase().indexOf('usuario') !== -1) return 'sesiones';
        }
      }
    }
    return null;
  }

  // ── PARSER: REPORTE FISCAL ────────────────────────────────────
  // Fuente: Sheet "REPORTE OPERADORA " (más completo que "REPORTE MAQUINAS 100%")
  // Estructura:
  //   Rows 0-8: headers/title
  //   Rows 9-39: DIA 01 a DIA 31 (col 1 = "DIA NN")
  //   Row 41: TOTAL
  //
  // Col map (0-based):
  //   1=FECHA, 3=Cover, 5=L007 Entradas, 6=L007 Ent70, 7=L007 Ent30
  //   8=L007 Dev, 9=L007 Premios, 10=L007 Pre70, 11=L007 Pre30
  //   12=L007 TotSalidas, 13=L007 IngresoFinal
  //   15=L002 Ent, 16=L002 Dev, 17=L002 Pre, 18=L002 Res
  //   19=L003 Ent, 20=L003 Dev, 21=L003 Pre, 22=L003 Res
  //   23=L005 Ent, 24=L005 Pre, 25=L005 Res
  //   26=L006 Ent, 27=L006 Dev, 28=L006 Pre, 29=L006 Res
  //   32=RetFed70, 33=RetEst70, 36=RetFed_30x70, 37=RetEst_30x70
  //   39=RetFed30, 40=RetEst30
  function parseReporteFiscal(workbook) {
    // Prefer "REPORTE OPERADORA" sheet for its multi-license detail
    var targetSheet = null;
    var mes = '';
    workbook.SheetNames.forEach(function(n) {
      if (n.trim().toUpperCase().indexOf('OPERADORA') !== -1) targetSheet = workbook.Sheets[n];
    });
    // Fallback to REPORTE MAQUINAS 100%
    if (!targetSheet) workbook.SheetNames.forEach(function(n) {
      if (n.trim().toUpperCase().indexOf('MAQUINA') !== -1) targetSheet = workbook.Sheets[n];
    });
    if (!targetSheet) return null;

    var raw = XLSX.utils.sheet_to_json(targetSheet, { header: 1, defval: null });

    // Extract month from header rows (look for "ABRIL 2026" etc.)
    for (var hi = 0; hi < 9; hi++) {
      var hr = raw[hi] || [];
      for (var hc = 0; hc < hr.length; hc++) {
        var hv = String(hr[hc] || '');
        if (hv.match(/\b(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\b.*\d{4}/i)) {
          mes = hv.replace(/.*\b(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)(\s+\d{4}).*/i, '$1$2').trim();
          break;
        }
      }
      if (mes) break;
    }

    var n = function(v) { return parseFloat(v) || 0; };
    var dias = [];
    var totales = null;

    for (var i = 0; i < raw.length; i++) {
      var r = raw[i];
      var fecha = r[1];
      var mDia = fecha ? String(fecha).match(/DIA\s*(\d+)/i) : null;

      if (mDia) {
        var dia = parseInt(mDia[1], 10);
        // Skip days with all zeros (future days)
        var l007ent = n(r[5]);
        var cover   = n(r[3]);
        if (l007ent === 0 && cover === 0 && n(r[9]) === 0) continue;

        dias.push({
          dia:             dia,
          cover:           cover,
          l007_entradas:   l007ent,
          l007_ent70:      n(r[6]),
          l007_ent30:      n(r[7]),
          l007_devol:      n(r[8]),
          l007_premios:    n(r[9]),
          l007_pre70:      n(r[10]),
          l007_pre30:      n(r[11]),
          l007_salidas:    n(r[12]),
          l007_ingreso:    n(r[13]),
          l002_entradas:   n(r[15]), l002_premios: n(r[17]), l002_resultado: n(r[18]),
          l003_entradas:   n(r[19]), l003_premios: n(r[21]), l003_resultado: n(r[22]),
          l005_entradas:   n(r[23]), l005_premios: n(r[24]), l005_resultado: n(r[25]),
          l006_entradas:   n(r[26]), l006_premios: n(r[28]), l006_resultado: n(r[29]),
          ret_fed70:       n(r[32]),
          ret_est70:       n(r[33]),
          ret_fed_30x70:   n(r[36]),
          ret_est_30x70:   n(r[37]),
          ret_fed30:       n(r[39]),
          ret_est30:       n(r[40])
        });
      } else if (i >= 40 && !fecha && (n(r[3]) !== 0 || n(r[5]) !== 0)) {
        // TOTAL row
        var tRetFed = n(r[32]) + n(r[36]) + n(r[39]);
        var tRetEst = n(r[33]) + n(r[37]) + n(r[40]);
        totales = {
          cover:          n(r[3]),
          l007_entradas:  n(r[5]),
          l007_premios:   n(r[9]),
          l007_ingreso:   n(r[13]),
          l002_resultado: n(r[18]),
          l003_resultado: n(r[22]),
          l005_resultado: n(r[25]),
          l006_resultado: n(r[29]),
          ret_federal:    tRetFed,
          ret_estatal:    tRetEst,
          ret_total:      tRetFed + tRetEst
        };
      }
    }

    if (!dias.length) return null;

    // Compute totals from dias if not found in sheet
    if (!totales) {
      totales = dias.reduce(function(acc, d) {
        acc.cover          += d.cover;
        acc.l007_entradas  += d.l007_entradas;
        acc.l007_premios   += d.l007_premios;
        acc.l007_ingreso   += d.l007_ingreso;
        acc.l002_resultado += d.l002_resultado;
        acc.l003_resultado += d.l003_resultado;
        acc.l005_resultado += d.l005_resultado;
        acc.l006_resultado += d.l006_resultado;
        acc.ret_federal    += d.ret_fed70 + d.ret_fed_30x70 + d.ret_fed30;
        acc.ret_estatal    += d.ret_est70 + d.ret_est_30x70 + d.ret_est30;
        return acc;
      }, { cover:0, l007_entradas:0, l007_premios:0, l007_ingreso:0, l002_resultado:0, l003_resultado:0, l005_resultado:0, l006_resultado:0, ret_federal:0, ret_estatal:0, ret_total:0 });
      totales.ret_total = totales.ret_federal + totales.ret_estatal;
    }

    // Ingresos totales de la sala (Cover + todos los ingresos finales por licencia)
    totales.ingreso_sala = totales.cover + totales.l007_ingreso +
      totales.l002_resultado + totales.l003_resultado + totales.l005_resultado + totales.l006_resultado;
    // 10% del ingreso sala → comisión de Grand Play (operadora)
    totales.comision_operadora_10pct = totales.l007_ingreso * 0.10;

    return { tipo: 'fiscal', mes: mes, dias: dias, totales: totales, nDias: dias.length };
  }

  // ── PARSER: SESIONES DE CAJA ──────────────────────────────────
  // Estructura:
  //   Rows 0-6: headers (row 6 = headers reales)
  //   Rows 7-194: datos (una fila por sesión)
  //   Row 195: TOTAL
  //
  // Col map (0-based):
  //   1=Usuario, 2=Apertura, 3=Cierre, 4=Terminal
  //   6=Entradas, 7=Salidas, 9=Impuestos, 10=ResultadoCaja
  //   30=DepositoJuego(ent), 31=Acceso(ent)
  //   37=DepositoJuego(sal), 38=Acceso(sal)
  //   40=PagoPremios, 43=RetencionPremios
  //   50=PromoRedimible, 51=PromoNoRedimible
  //   52=CancelPromoRed, 56=NoRedimibleCaducado
  function parseSesionesCaja(workbook) {
    var sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return null;

    var raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    var n   = function(v) { return parseFloat(v) || 0; };

    // Find the header row dynamically (look for "Usuario")
    var headerRow = 6;
    for (var hi = 0; hi < Math.min(12, raw.length); hi++) {
      var hr = raw[hi] || [];
      for (var hc = 0; hc < Math.min(10, hr.length); hc++) {
        if (hr[hc] && String(hr[hc]).toLowerCase().indexOf('usuario') !== -1) {
          headerRow = hi; break;
        }
      }
    }
    var dataStart = headerRow + 1;

    var sesiones = [];
    var desde = '', hasta = '';

    for (var i = dataStart; i < raw.length; i++) {
      var r = raw[i];
      var usuario = r[1];
      if (!usuario) continue;
      var usuarioStr = String(usuario).trim();
      if (usuarioStr.toUpperCase().startsWith('TOTAL')) break; // totals row

      var apertura = r[2] ? String(r[2]) : '';
      // Extract date YYYY-MM-DD from datetime string (format: "01/04/2026 08:00:00")
      var fechaStr = '';
      var dmy = apertura.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (dmy) fechaStr = dmy[3] + '-' + dmy[2] + '-' + dmy[1];

      if (fechaStr && !desde) desde = fechaStr;
      if (fechaStr) hasta = fechaStr;

      var entradas = n(r[6]);
      var salidas  = n(r[7]);
      if (entradas === 0 && salidas === 0) continue; // sesion sin movimiento

      sesiones.push({
        usuario:         usuarioStr,
        fecha:           fechaStr,
        apertura:        apertura,
        terminal:        r[4] ? String(r[4]).trim() : '',
        entradas:        entradas,
        salidas:         salidas,
        impuestos:       n(r[9]),
        resultadoCaja:   n(r[10]),
        depositoJuego:   n(r[30]),
        acceso:          n(r[31]),
        premios:         n(r[40]),
        retencion:       n(r[43]),
        promoRedimible:  n(r[50]),
        promoNoRed:      n(r[51]),
        cancelPromoRed:  n(r[52]),
        noRedCaducado:   n(r[56])
      });
    }

    if (!sesiones.length) return null;

    // Aggregate by day
    var porDiaMap = {};
    sesiones.forEach(function(s) {
      if (!s.fecha) return;
      if (!porDiaMap[s.fecha]) porDiaMap[s.fecha] = {
        fecha:0, nSesiones:0,
        entradas:0, salidas:0, impuestos:0, resultadoCaja:0,
        depositoJuego:0, acceso:0, premios:0, retencion:0,
        promoRedimible:0, promoNoRed:0, cancelPromoRed:0, noRedCaducado:0
      };
      var d = porDiaMap[s.fecha];
      d.fecha = s.fecha; d.nSesiones++;
      d.entradas      += s.entradas;      d.salidas       += s.salidas;
      d.impuestos     += s.impuestos;     d.resultadoCaja += s.resultadoCaja;
      d.depositoJuego += s.depositoJuego; d.acceso        += s.acceso;
      d.premios       += s.premios;       d.retencion     += s.retencion;
      d.promoRedimible+= s.promoRedimible; d.promoNoRed   += s.promoNoRed;
      d.cancelPromoRed+= s.cancelPromoRed; d.noRedCaducado+= s.noRedCaducado;
    });
    var porDia = Object.values(porDiaMap).sort(function(a,b){ return a.fecha.localeCompare(b.fecha); });

    // Totals
    var tot = porDia.reduce(function(acc, d) {
      acc.entradas       += d.entradas;      acc.salidas         += d.salidas;
      acc.impuestos      += d.impuestos;     acc.resultadoCaja   += d.resultadoCaja;
      acc.depositoJuego  += d.depositoJuego; acc.acceso          += d.acceso;
      acc.premios        += d.premios;       acc.retencion       += d.retencion;
      acc.promoRedimible += d.promoRedimible; acc.promoNoRed     += d.promoNoRed;
      acc.cancelPromoRed += d.cancelPromoRed; acc.noRedCaducado  += d.noRedCaducado;
      return acc;
    }, { entradas:0, salidas:0, impuestos:0, resultadoCaja:0, depositoJuego:0, acceso:0, premios:0, retencion:0, promoRedimible:0, promoNoRed:0, cancelPromoRed:0, noRedCaducado:0 });

    return { tipo: 'sesiones', desde: desde, hasta: hasta, nSesiones: sesiones.length, porDia: porDia, totales: tot };
  }

  // ── SAVE REPORTE ─────────────────────────────────────────────
  function operadora_saveReporte(parsed) {
    var data = operadoraLoad();

    if (parsed.tipo === 'fiscal') {
      // Replace existing if same mes
      var replaced = false;
      for (var i = 0; i < data.reportes.length; i++) {
        if (data.reportes[i].mes === parsed.mes) {
          data.reportes[i] = _addFiscalMeta(parsed); replaced = true; break;
        }
      }
      if (!replaced) data.reportes.unshift(_addFiscalMeta(parsed));
      if (data.reportes.length > 24) data.reportes = data.reportes.slice(0, 24);

    } else if (parsed.tipo === 'sesiones') {
      // Replace existing if same desde+hasta
      var replaced2 = false;
      for (var j = 0; j < data.sesiones.length; j++) {
        if (data.sesiones[j].desde === parsed.desde && data.sesiones[j].hasta === parsed.hasta) {
          data.sesiones[j] = _addSesionesMeta(parsed); replaced2 = true; break;
        }
      }
      if (!replaced2) data.sesiones.unshift(_addSesionesMeta(parsed));
      if (data.sesiones.length > 24) data.sesiones = data.sesiones.slice(0, 24);
    }

    operadora_save(data);
    return parsed;
  }

  function _addFiscalMeta(p) {
    return Object.assign({}, p, { id: Date.now(), uploadedAt: new Date().toISOString().split('T')[0] });
  }
  function _addSesionesMeta(p) {
    return Object.assign({}, p, { id: Date.now(), uploadedAt: new Date().toISOString().split('T')[0] });
  }

  // ── CROSS-REFERENCE: validar sesiones vs fiscal ──────────────
  // Compara totales de sesiones con el reporte fiscal del mismo período
  function operadoraCrossRef(fiscal, sesiones) {
    if (!fiscal || !sesiones) return null;
    var diff_entradas = (sesiones.totales.depositoJuego + sesiones.totales.acceso) - (fiscal.totales.l007_entradas + fiscal.totales.cover);
    var diff_premios  = sesiones.totales.premios - fiscal.totales.l007_premios;
    var diff_ret      = sesiones.totales.retencion - fiscal.totales.ret_total;
    return {
      diff_entradas: diff_entradas,
      diff_premios:  diff_premios,
      diff_ret:      diff_ret,
      ok_entradas:   Math.abs(diff_entradas) < 100,
      ok_premios:    Math.abs(diff_premios)  < 100,
      ok_ret:        Math.abs(diff_ret)      < 100
    };
  }

  // ── DERIVAR FISCAL DESDE SESIONES ────────────────────────────
  // Genera un objeto fiscal-compatible a partir de sesiones de caja
  // Fórmulas: 70/30 mecánico, Federal 1%, Estatal 6%, L002-L006 = 0
  function deriveFiscalFromSesiones(ses) {
    if (!ses || !ses.porDia || !ses.porDia.length) return null;
    var n = function(v) { return parseFloat(v) || 0; };
    var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    var totRF70 = 0, totRE70 = 0, totRF30 = 0, totRE30 = 0;

    var dias = ses.porDia.map(function(d) {
      var cover     = n(d.acceso);
      var l007ent   = n(d.depositoJuego);
      var l007pre   = n(d.premios);
      var l007ent70 = l007ent * 0.70;  var l007ent30 = l007ent * 0.30;
      var l007pre70 = l007pre * 0.70;  var l007pre30 = l007pre * 0.30;
      var l007sal   = l007pre;          // devoluciones = 0
      var l007ing   = l007ent - l007sal;
      var rf70 = l007pre70 * 0.01;     var re70 = l007pre70 * 0.06;
      var rf30 = l007pre30 * 0.01;     var re30 = l007pre30 * 0.06;
      totRF70 += rf70; totRE70 += re70; totRF30 += rf30; totRE30 += re30;
      var diaNum = d.fecha ? parseInt(d.fecha.slice(8), 10) : 0;
      return {
        dia: diaNum, cover,
        l007_entradas: l007ent, l007_ent70, l007_ent30,
        l007_devol: 0, l007_premios: l007pre, l007_pre70, l007_pre30,
        l007_salidas: l007sal, l007_ingreso: l007ing,
        l002_entradas:0,l002_premios:0,l002_resultado:0,
        l003_entradas:0,l003_premios:0,l003_resultado:0,
        l005_entradas:0,l005_premios:0,l005_resultado:0,
        l006_entradas:0,l006_premios:0,l006_resultado:0,
        ret_fed70: rf70, ret_est70: re70,
        ret_fed_30x70: 0, ret_est_30x70: 0,
        ret_fed30: rf30, ret_est30: re30
      };
    });

    var totales = {
      cover:           ses.totales.acceso        || 0,
      l007_entradas:   ses.totales.depositoJuego || 0,
      l007_premios:    ses.totales.premios        || 0,
      l007_ingreso:    (ses.totales.depositoJuego||0) - (ses.totales.premios||0),
      l002_resultado:0, l003_resultado:0, l005_resultado:0, l006_resultado:0,
      ret_federal:  totRF70 + totRF30,
      ret_estatal:  totRE70 + totRE30,
      ret_total:    totRF70 + totRF30 + totRE70 + totRE30,
      ret_fed70: totRF70, ret_est70: totRE70, ret_fed30: totRF30, ret_est30: totRE30
    };
    totales.ingreso_sala = totales.cover + totales.l007_ingreso;
    totales.comision_operadora_10pct = totales.l007_ingreso * 0.10;

    var mes = '';
    if (ses.porDia[0] && ses.porDia[0].fecha) {
      var p = ses.porDia[0].fecha.split('-');
      mes = MESES[parseInt(p[1],10)-1] + ' ' + p[0];
    }
    return { tipo:'fiscal', mes, dias, totales, nDias: dias.length, derivadoDeSesiones: true };
  }

  // ── GENERAR EXCEL REPORTE FISCAL ─────────────────────────────
  // Replica las columnas del REPORTE OPERADORA para enviar a Grand Play
  function operadora_generateExcel(fiscal) {
    if (typeof XLSX === 'undefined') { alert('Librería XLSX no disponible — recarga la página'); return; }
    if (!fiscal || !fiscal.dias) return;

    var f = function(v) { return Math.round((parseFloat(v)||0)*100)/100; };
    var NCOLS = 41;
    function mkRow(map) {
      var r = new Array(NCOLS).fill(null);
      Object.keys(map).forEach(function(k){ r[+k] = map[k]; });
      return r;
    }

    var aoa = [];
    // Encabezado
    aoa.push(mkRow({1:'REPORTE INGRESOS SALA STELLARIS FISCAL'}));
    aoa.push(mkRow({1:'MES: ' + (fiscal.mes||'').toUpperCase()}));
    aoa.push([]);
    // Nombres de licencias
    aoa.push(mkRow({3:'ACCESO',5:'L007 TERMINALES',15:'L002 CARRERAS',19:'L003 DEPORTIVAS',23:'L005 BINGO',26:'L006 MESAS',32:'RETENCIONES'}));
    // Headers de columnas
    aoa.push(mkRow({
      1:'FECHA',     3:'COVER',
      5:'ENTRADAS',  6:'ENT 70%', 7:'ENT 30%', 8:'DEVOL.', 9:'PREMIOS', 10:'PRE 70%', 11:'PRE 30%', 12:'SALIDAS', 13:'ING. FINAL',
      15:'ENTRADAS', 16:'DEVOL.', 17:'PREMIOS', 18:'RESULTADO',
      19:'ENTRADAS', 20:'DEVOL.', 21:'PREMIOS', 22:'RESULTADO',
      23:'ENTRADAS', 24:'PREMIOS',25:'RESULTADO',
      26:'ENTRADAS', 27:'DEVOL.', 28:'PREMIOS', 29:'RESULTADO',
      32:'FED 70%',  33:'EST 70%',
      36:'FED(30x70)',37:'EST(30x70)',
      39:'FED 30%',  40:'EST 30%'
    }));
    aoa.push([]);
    // Filas de datos
    fiscal.dias.forEach(function(d) {
      aoa.push(mkRow({
        1:'DIA '+String(d.dia).padStart(2,'0'),
        3:f(d.cover),
        5:f(d.l007_entradas), 6:f(d.l007_ent70), 7:f(d.l007_ent30),
        8:0, 9:f(d.l007_premios), 10:f(d.l007_pre70), 11:f(d.l007_pre30),
        12:f(d.l007_salidas), 13:f(d.l007_ingreso),
        15:0,16:0,17:0,18:0, 19:0,20:0,21:0,22:0,
        23:0,24:0,25:0,      26:0,27:0,28:0,29:0,
        32:f(d.ret_fed70), 33:f(d.ret_est70),
        36:0, 37:0,
        39:f(d.ret_fed30), 40:f(d.ret_est30)
      }));
    });
    aoa.push([]);
    // Fila TOTAL
    var t = fiscal.totales;
    aoa.push(mkRow({
      1:'TOTAL',
      3:f(t.cover),
      5:f(t.l007_entradas), 9:f(t.l007_premios), 13:f(t.l007_ingreso),
      32:f(t.ret_fed70||0), 33:f(t.ret_est70||0),
      36:0, 37:0,
      39:f(t.ret_fed30||0), 40:f(t.ret_est30||0)
    }));

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    // Anchos de columna
    var wscols = new Array(NCOLS).fill({wch:8});
    wscols[1]={wch:12}; wscols[3]={wch:14}; wscols[5]={wch:14}; wscols[13]={wch:14};
    ws['!cols'] = wscols;

    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'REPORTE OPERADORA');
    var fname = 'Reporte_Fiscal_Stellaris_' + (fiscal.mes||'').replace(/\s+/g,'_') + '.xlsx';
    XLSX.writeFile(wb, fname);
  }

  // ── EXPOSE ────────────────────────────────────────────────────
  window.OPERADORA_KEY            = OPERADORA_KEY;
  window.operadoraLoad            = operadoraLoad;
  window.operadora_save           = operadora_save;
  window.detectOperadoraTipo      = detectOperadoraTipo;
  window.parseReporteFiscal       = parseReporteFiscal;
  window.parseSesionesCaja        = parseSesionesCaja;
  window.operadora_saveReporte    = operadora_saveReporte;
  window.operadoraCrossRef        = operadoraCrossRef;
  window.deriveFiscalFromSesiones = deriveFiscalFromSesiones;
  window.operadora_generateExcel  = operadora_generateExcel;

})(window);
