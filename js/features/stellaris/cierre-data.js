// GF — Stellaris: Cierre Maquineros — Data Layer
// Parser, storage, matching de tasas, y cálculo de comisiones
(function(window) {
  'use strict';

  var CIERRE_KEY = 'gf_cierre_maquineros';
  var IVA = 0.16;

  // ── STORAGE ──────────────────────────────────────────────────
  function cierreLoad() {
    try {
      var d = (typeof DB !== 'undefined' && DB.get) ? DB.get(CIERRE_KEY) : null;
      if (d && d.cortes) return d;
    } catch(e) {}
    return { tasas: [], cortes: [] };
  }

  function cierre_save(data) {
    if (typeof DB !== 'undefined' && DB.set) DB.set(CIERRE_KEY, data);
  }

  // ── TASAS DEFAULT (tabla Comisiones del Excel) ────────────────
  // Estas tasas se actualizan automáticamente al subir un Excel con Sheet2
  var DEFAULT_TASAS = [
    { id:'merkur_todas',    proveedor:'Merkur', tipo:'Todas',           pct:0.21, color:'#7b5ea7', nombres:['F-MK MAX TRIO','NF-MK TRIO'],                                      esOperadora:false },
    { id:'zitro_todas',     proveedor:'Zitro',  tipo:'Todas',           pct:0.25, color:'#e74c3c', nombres:['F-ZT ALLURE SLOT','NF-ZT FUSION SLOT'],                             esOperadora:false },
    { id:'egt_premier',     proveedor:'EGT',    tipo:'Premier',         pct:0.20, color:'#0073ea', nombres:['F-EGT VS9_1','F-EGT V55','NF-EGT VS9_1','NF-EGT V55'],             esOperadora:false },
    { id:'egt_general',     proveedor:'EGT',    tipo:'General',         pct:0.21, color:'#0073ea', nombres:['F-EGT VS34','NF-EGT VS34'],                                         esOperadora:false },
    { id:'egt_general_vip', proveedor:'EGT',    tipo:'General VIP',     pct:0.22, color:'#0073ea', nombres:[],                                                                    esOperadora:false },
    { id:'ortiz_ocircle',   proveedor:'Ortiz',  tipo:"O'Circle",        pct:0.19, color:'#00b875', nombres:['NF-BINGO CIRCLE'],                                                  esOperadora:false },
    { id:'ortiz_ovision',   proveedor:'Ortiz',  tipo:"O'Vision",        pct:0.21, color:'#00b875', nombres:['F-ORTIZ OVISION'],                                                  esOperadora:false },
    { id:'ags_dvs23',       proveedor:'AGS',    tipo:'DVS-23',          pct:0.20, color:'#ff7043', nombres:['F-AGS ALORA','NF-AGS ALORA','F-AGS ICON','NF-AGS ICON'],           esOperadora:false },
    { id:'ags_st42p',       proveedor:'AGS',    tipo:'ST42P',           pct:0.23, color:'#ff7043', nombres:['NF-ORION ST42P'],                                                   esOperadora:false },
    { id:'ags_inf_v55',     proveedor:'AGS',    tipo:'Infinity V55',    pct:0.20, color:'#ff7043', nombres:['F-INFINITY V55'],                                                   esOperadora:false },
    { id:'ags_genesis',     proveedor:'AGS',    tipo:'Genesis Crest',   pct:0.24, color:'#ff7043', nombres:[],                                                                   esOperadora:false },
    { id:'fbm_spins',       proveedor:'FBM',    tipo:'Spins',           pct:0.21, color:'#f39c12', nombres:['NF-FBM'],                                                           esOperadora:false },
    { id:'fbm_videobingo',  proveedor:'FBM',    tipo:'VideoBingo',      pct:0.18, color:'#f39c12', nombres:['F-FBM BINGO','NF-FBM BINGO'],                                      esOperadora:false },
    { id:'operadora',       proveedor:'Operadora', tipo:'Sobre todas las maquinas', pct:0.10, color:'#9b51e0', nombres:[], esOperadora:true }
  ];

  // ── MATCH MACHINE → TASA ─────────────────────────────────────
  function cierreMatchTasa(nombre, fabricante, tasas) {
    var base = String(nombre).replace(/-\d+$/, '').trim();
    var i, j, t, n;

    // 1. Exact match contra nombres en tasas
    for (i = 0; i < tasas.length; i++) {
      t = tasas[i];
      if (t.esOperadora) continue;
      for (j = 0; j < (t.nombres || []).length; j++) {
        n = String(t.nombres[j] || '').trim();
        if (n && base === n) return t;
      }
    }

    // 2. Prefix match (base starts with pattern)
    for (i = 0; i < tasas.length; i++) {
      t = tasas[i];
      if (t.esOperadora) continue;
      for (j = 0; j < (t.nombres || []).length; j++) {
        n = String(t.nombres[j] || '').trim();
        if (n && base.startsWith(n)) return t;
      }
    }

    // 3. Fallback: Fabricante con tipo = "Todas"
    var fabUp = String(fabricante || '').trim().toUpperCase();
    for (i = 0; i < tasas.length; i++) {
      t = tasas[i];
      if (!t.esOperadora && t.tipo === 'Todas' && t.proveedor.toUpperCase() === fabUp) return t;
    }

    return null;
  }

  // ── PARSE EXCEL ──────────────────────────────────────────────
  // Detecta columnas dinámicamente leyendo headers reales del Excel
  // Soporta variantes del sistema de casino (Wigos u otros)
  function parseCierreExcel(workbook) {
    if (!workbook || !workbook.SheetNames || !workbook.SheetNames.length) return null;

    var sheet1 = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet1) return null;
    var raw = XLSX.utils.sheet_to_json(sheet1, { header: 1, defval: null });

    // ── Metadata: escanear primeras 8 filas buscando casino y fechas ──
    var casino = '', desde = '', hasta = '';
    var i, c;
    for (i = 0; i < Math.min(8, raw.length); i++) {
      var mr = raw[i] || [];
      for (c = 0; c < mr.length; c++) {
        var mv = String(mr[c] || '');
        if (!mv) continue;
        if (!casino && (mv.indexOf('CASINO') !== -1 || mv.indexOf('Casino') !== -1)) {
          casino = mv.split('|')[0].replace(/Generado:/i,'').trim();
        }
        var mD = mv.match(/Fecha Desde:\s*(\d{2}\/\d{2}\/\d{4})/i);
        var mH = mv.match(/Fecha Hasta:\s*(\d{2}\/\d{2}\/\d{4})/i);
        if (mD && !desde) desde = mD[1];
        if (mH && !hasta) hasta = mH[1];
      }
    }

    // ── Detectar fila de headers y columnas ──
    // Busca la fila que tenga "Nombre" o "Fabricante" entre las primeras 12 filas
    var headerRow = -1;
    // Columnas por defecto (fallback si no se detectan)
    var colFab = 3, colNom = 5, colCoinIn = 9, colNetwin = 17, colJugadas = 19;

    for (i = 0; i < Math.min(12, raw.length); i++) {
      var hr = raw[i] || [];
      var foundNom = false, foundFab = false;
      for (c = 0; c < hr.length; c++) {
        var hv = String(hr[c] || '').toLowerCase().replace(/\s+/g,' ').trim();
        if (!hv) continue;
        if (hv === 'nombre' || hv === 'name' || hv === 'terminal' || hv === 'máquina' || hv === 'maquina') {
          colNom = c; foundNom = true;
        }
        if (hv === 'fabricante' || hv === 'manufacturer' || hv === 'marca' || hv === 'proveedor') {
          colFab = c; foundFab = true;
        }
        if (hv === 'coin in' || hv === 'coin_in' || hv === 'coinin' || hv === 'total apostado' || hv === 'apostado') {
          colCoinIn = c;
        }
        if (hv === 'net win' || hv === 'netwin' || hv === 'net_win' || hv === 'ingreso neto' || hv === 'neto') {
          colNetwin = c;
        }
        if (hv === 'jugadas' || hv === 'games' || hv === 'plays' || hv === 'partidas') {
          colJugadas = c;
        }
      }
      if (foundNom || foundFab) {
        headerRow = i;
        if (foundNom && foundFab) break; // fila completa encontrada
      }
    }

    var dataStart = headerRow >= 0 ? headerRow + 1 : 7;

    // ── Leer datos de máquinas ──
    var maquinas = [];
    for (i = dataStart; i < raw.length; i++) {
      var r = raw[i];
      if (!r) continue;
      var fab = r[colFab];
      var nom = r[colNom];
      if (!fab && !nom) continue;
      var fabStr = fab ? String(fab).trim() : '';
      var nomStr = nom ? String(nom).trim() : '';
      if (!nomStr && !fabStr) continue;
      // Saltar filas de totales o subtotales
      if (nomStr.match(/^(total|sub.?total|suma|gran)/i)) continue;
      if (fabStr.match(/^(total|sub.?total|suma|gran)/i)) continue;
      // Debe tener letras para ser un nombre de máquina válido
      if (!nomStr.match(/[a-zA-Z]/) && !fabStr.match(/[a-zA-Z]/)) continue;
      // Netwin debe ser numérico (aunque sea 0 o negativo)
      var nw = parseFloat(r[colNetwin]);
      if (isNaN(nw)) continue;

      maquinas.push({
        fabricante: fabStr || nomStr.split(' ')[0],
        nombre:     nomStr || fabStr,
        coinIn:     parseFloat(r[colCoinIn]) || 0,
        netwin:     nw,
        jugadas:    parseFloat(r[colJugadas]) || 0
      });
    }

    // ── Tasas de Sheet2 (si existe) ──
    var tasas = [];
    if (workbook.SheetNames.length > 1) {
      var sheet2 = workbook.Sheets[workbook.SheetNames[1]];
      if (sheet2) {
        var rawT = XLSX.utils.sheet_to_json(sheet2, { header: 1, defval: null });
        // Buscar fila de headers en Sheet2
        var t2DataStart = 2;
        for (i = 0; i < Math.min(5, rawT.length); i++) {
          var t2h = rawT[i] || [];
          for (c = 0; c < t2h.length; c++) {
            var t2hv = String(t2h[c] || '').toLowerCase();
            if (t2hv.indexOf('proveedor') !== -1 || t2hv.indexOf('fabricante') !== -1) {
              t2DataStart = i + 1; break;
            }
          }
        }
        for (i = t2DataStart; i < rawT.length; i++) {
          var tr = rawT[i];
          if (!tr || !tr[1]) continue;
          var prov = String(tr[1]).trim();
          var tipo = String(tr[2] || '').trim();
          var pct  = parseFloat(tr[3]) || 0;
          if (!prov || !pct) continue;
          var noms = [];
          for (c = 4; c <= 9; c++) {
            if (tr[c] && String(tr[c]).trim()) noms.push(String(tr[c]).trim());
          }
          var isOp = prov.toLowerCase().indexOf('operadora') !== -1;
          var defCol = '#8b95a5';
          for (var di = 0; di < DEFAULT_TASAS.length; di++) {
            if (DEFAULT_TASAS[di].proveedor.toLowerCase() === prov.toLowerCase()) { defCol = DEFAULT_TASAS[di].color; break; }
          }
          tasas.push({
            id:          (prov + '_' + tipo).toLowerCase().replace(/[\s\/'áéíóú]/g, '_'),
            proveedor:   prov,
            tipo:        tipo,
            pct:         pct,
            color:       defCol,
            nombres:     noms,
            esOperadora: isOp
          });
        }
      }
    }

    // Debug info para diagnóstico
    var _debug = { headerRow: headerRow, dataStart: dataStart, colFab: colFab, colNom: colNom, colNetwin: colNetwin, totalRows: raw.length };
    return { maquinas: maquinas, tasas: tasas, desde: desde, hasta: hasta, casino: casino, _debug: _debug };
  }

  // ── CALCULAR COMISIONES ───────────────────────────────────────
  function cierreCalcular(maquinas, tasas) {
    var operadoraTasa = null;
    var i;
    for (i = 0; i < tasas.length; i++) {
      if (tasas[i].esOperadora) { operadoraTasa = tasas[i]; break; }
    }

    var netwinTotal = 0;
    var sinTasa = [];
    var gruposMap = {};

    for (i = 0; i < maquinas.length; i++) {
      var m = maquinas[i];
      netwinTotal += m.netwin;
      var t = cierreMatchTasa(m.nombre, m.fabricante, tasas);
      if (!t) { sinTasa.push(m.nombre); continue; }
      var key = t.id;
      if (!gruposMap[key]) gruposMap[key] = { tasa: t, netwin: 0, coinIn: 0, jugadas: 0, maquinas: [] };
      gruposMap[key].netwin   += m.netwin;
      gruposMap[key].coinIn   += m.coinIn;
      gruposMap[key].jugadas  += m.jugadas;
      gruposMap[key].maquinas.push(m);
    }

    // Agrupar por proveedor
    var provMap = {};
    var gKeys = Object.keys(gruposMap);
    for (i = 0; i < gKeys.length; i++) {
      var g = gruposMap[gKeys[i]];
      var prov = g.tasa.proveedor;
      var comBase = Math.max(0, g.netwin) * g.tasa.pct;
      var iva = comBase * IVA;
      if (!provMap[prov]) provMap[prov] = {
        proveedor: prov, color: g.tasa.color,
        netwin: 0, coinIn: 0, jugadas: 0, nMaquinas: 0,
        comBase: 0, iva: 0, total: 0, grupos: []
      };
      provMap[prov].netwin    += g.netwin;
      provMap[prov].coinIn    += g.coinIn;
      provMap[prov].jugadas   += g.jugadas;
      provMap[prov].nMaquinas += g.maquinas.length;
      provMap[prov].comBase   += comBase;
      provMap[prov].iva       += iva;
      provMap[prov].total     += comBase + iva;
      provMap[prov].grupos.push({
        tipo: g.tasa.tipo, pct: g.tasa.pct,
        netwin: g.netwin, comBase: comBase, iva: iva, total: comBase + iva,
        nMaquinas: g.maquinas.length
      });
    }

    var proveedorItems = Object.values(provMap).sort(function(a,b){ return b.total - a.total; });
    var totalComBase = proveedorItems.reduce(function(s,p){ return s + p.comBase; }, 0);
    var totalComIva  = proveedorItems.reduce(function(s,p){ return s + p.iva; }, 0);
    var totalComMaquineros = totalComBase + totalComIva;

    // Operadora
    var opPct  = operadoraTasa ? operadoraTasa.pct : 0.10;
    var opBase = Math.max(0, netwinTotal) * opPct;
    var opIva  = opBase * IVA;
    var comOperadora = { pct: opPct, base: opBase, iva: opIva, total: opBase + opIva };

    // Neto Stellaris = Netwin - bases (IVA es recuperable, es un pass-through)
    var netoStellaris = netwinTotal - totalComBase - opBase;

    return {
      netwinTotal:        netwinTotal,
      proveedorItems:     proveedorItems,
      totalComBase:       totalComBase,
      totalComIva:        totalComIva,
      totalComMaquineros: totalComMaquineros,
      comOperadora:       comOperadora,
      netoStellaris:      netoStellaris,
      sinTasa:            sinTasa
    };
  }

  // ── SAVE CORTE ────────────────────────────────────────────────
  function cierre_saveCorte(parsed) {
    var data = cierreLoad();

    // Usar tasas del Excel si vienen; si no, las existentes o el default
    var tasas = (parsed.tasas && parsed.tasas.length)
      ? parsed.tasas
      : (data.tasas && data.tasas.length ? data.tasas : DEFAULT_TASAS);
    data.tasas = tasas;

    var kpis = cierreCalcular(parsed.maquinas, tasas);

    var corte = {
      id:         Date.now(),
      desde:      parsed.desde,
      hasta:      parsed.hasta,
      desdeISO:   _dmy2iso(parsed.desde),
      hastaISO:   _dmy2iso(parsed.hasta),
      casino:     parsed.casino || '',
      uploadedAt: new Date().toISOString().split('T')[0],
      maquinas:   parsed.maquinas,
      kpis:       kpis
    };

    // Reemplazar si mismo período ya existe
    var replaced = false;
    for (var i = 0; i < data.cortes.length; i++) {
      if (data.cortes[i].desde === corte.desde && data.cortes[i].hasta === corte.hasta) {
        data.cortes[i] = corte; replaced = true; break;
      }
    }
    if (!replaced) data.cortes.unshift(corte);
    if (data.cortes.length > 48) data.cortes = data.cortes.slice(0, 48);

    cierre_save(data);
    return corte;
  }

  function _dmy2iso(str) {
    // DD/MM/YYYY → YYYY-MM-DD
    if (!str) return '';
    var p = str.split('/');
    return (p.length === 3) ? (p[2] + '-' + p[1] + '-' + p[0]) : str;
  }

  // ── ACUMULADO MENSUAL ─────────────────────────────────────────
  // Devuelve el corte más reciente del mes (más días cubiertos = más completo)
  function cierreAcumuladoMes(ym) {
    var data = cierreLoad();
    if (!data.cortes.length) return null;
    var mesCortes = data.cortes.filter(function(c) {
      return c.desdeISO && c.desdeISO.slice(0, 7) === ym;
    });
    if (!mesCortes.length) return null;
    mesCortes.sort(function(a, b) { return b.hastaISO.localeCompare(a.hastaISO); });
    return { mes: ym, nCortes: mesCortes.length, cortes: mesCortes, latest: mesCortes[0], kpis: mesCortes[0].kpis };
  }

  // ── LISTADO DE MESES DISPONIBLES ─────────────────────────────
  function cierre_mesesDisponibles() {
    var data = cierreLoad();
    var seen = {};
    var meses = [];
    data.cortes.forEach(function(c) {
      var ym = c.desdeISO ? c.desdeISO.slice(0, 7) : '';
      if (ym && !seen[ym]) { seen[ym] = true; meses.push(ym); }
    });
    meses.sort(function(a,b){ return b.localeCompare(a); });
    return meses;
  }

  // ── EXPOSE ────────────────────────────────────────────────────
  window.CIERRE_KEY       = CIERRE_KEY;
  window.DEFAULT_TASAS    = DEFAULT_TASAS;
  window.cierreLoad       = cierreLoad;
  window.cierre_save      = cierre_save;
  window.cierreMatchTasa  = cierreMatchTasa;
  window.parseCierreExcel = parseCierreExcel;
  window.cierreCalcular   = cierreCalcular;
  window.cierre_saveCorte = cierre_saveCorte;
  window.cierreAcumuladoMes = cierreAcumuladoMes;
  window.cierre_mesesDisponibles = cierre_mesesDisponibles;

})(window);
