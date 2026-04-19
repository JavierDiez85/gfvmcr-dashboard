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
  // Estructura Sheet1:
  //   Row 0: blank | Row 1: title | Row 2: params (Fecha Desde/Hasta)
  //   Row 3: descripcion | Row 4: blank | Row 5-6: headers
  //   Row 7+: datos (col 3=Fabricante, col 5=Nombre, col 9=CoinIn, col 17=Netwin, col 19=Jugadas)
  // Estructura Sheet2:
  //   Row 1: headers | Rows 2-15: tasas | Row 18: Operadora
  function parseCierreExcel(workbook) {
    if (!workbook || !workbook.SheetNames || !workbook.SheetNames.length) return null;

    var sheet1 = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet1) return null;
    var raw = XLSX.utils.sheet_to_json(sheet1, { header: 1, defval: null });

    // Metadata
    var casino = '', desde = '', hasta = '';
    var i, c;
    var metaRow = raw[1] || [];
    for (c = 0; c < metaRow.length; c++) {
      var mc = String(metaRow[c] || '');
      if (mc.indexOf('CASINO') !== -1 || mc.indexOf('Casino') !== -1) {
        casino = mc.split('|')[0].replace(/Generado:/i, '').trim();
        break;
      }
    }
    var paramStr = '';
    var paramRow = raw[2] || [];
    for (c = 0; c < paramRow.length; c++) {
      if (paramRow[c]) { paramStr = String(paramRow[c]); break; }
    }
    var mD = paramStr.match(/Fecha Desde:\s*(\d{2}\/\d{2}\/\d{4})/);
    var mH = paramStr.match(/Fecha Hasta:\s*(\d{2}\/\d{2}\/\d{4})/);
    if (mD) desde = mD[1];
    if (mH) hasta = mH[1];

    // Machine data rows
    var maquinas = [];
    for (i = 7; i < raw.length; i++) {
      var r = raw[i];
      var fab = r[3];
      var nom = r[5];
      if (!fab || !nom || typeof nom !== 'string') continue;
      if (String(nom).match(/^total/i)) continue; // skip total rows
      maquinas.push({
        fabricante: String(fab).trim(),
        nombre:     String(nom).trim(),
        coinIn:     parseFloat(r[9])  || 0,
        netwin:     parseFloat(r[17]) || 0,
        jugadas:    parseFloat(r[19]) || 0
      });
    }

    // Tasas from Sheet2
    var tasas = [];
    if (workbook.SheetNames.length > 1) {
      var sheet2 = workbook.Sheets[workbook.SheetNames[1]];
      if (sheet2) {
        var rawT = XLSX.utils.sheet_to_json(sheet2, { header: 1, defval: null });
        for (i = 2; i < rawT.length; i++) {
          var tr = rawT[i];
          if (!tr[1]) continue;
          var prov = String(tr[1]).trim();
          var tipo = String(tr[2] || '').trim();
          var pct  = parseFloat(tr[3]) || 0;
          if (!prov || !pct) continue;
          var noms = [];
          for (c = 4; c <= 9; c++) {
            if (tr[c]) noms.push(String(tr[c]).trim());
          }
          var isOp = prov.toLowerCase() === 'operadora';
          // find default color for this provider
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

    return { maquinas: maquinas, tasas: tasas, desde: desde, hasta: hasta, casino: casino };
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
