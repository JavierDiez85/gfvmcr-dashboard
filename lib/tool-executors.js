// GF — Tool executors: server-side data fetching + credit processing
'use strict';
const { supabaseRpc, getAppData } = require('./supabase-helpers');
const { isToolAllowed } = require('./permissions');

// ── Financial constants (configurable via env vars) ──
const IVA_RATE = +(process.env.IVA_RATE || 0.16);
const TERMINAL_INACTIVITY_DAYS = +(process.env.TERMINAL_INACTIVITY_DAYS || 15);

/** Truncate large arrays to avoid blowing up token budget */
function truncateResult(data, maxItems = 80) {
  if (!Array.isArray(data)) return data;
  if (data.length <= maxItems) return data;
  return { _truncated: true, total: data.length, showing: maxItems, data: data.slice(0, maxItems) };
}

// ── Credit pre-processing (replicate credit-engine.js logic server-side) ──
const _MESES_MAP = {ene:0,feb:1,mar:2,abr:3,apr:3,may:4,jun:5,jul:6,ago:7,aug:7,sep:8,oct:9,nov:10,dic:11,dec:11};

function _credParseDate(str) {
  if (!str) return null;
  const p = str.split('/');
  if (p.length !== 3) return null;
  let mes = parseInt(p[1]);
  if (isNaN(mes)) {
    mes = _MESES_MAP[(p[1]||'').toLowerCase().substring(0,3)];
    if (mes === undefined) return null;
  } else { mes--; }
  return new Date(parseInt(p[2]), mes, parseInt(p[0]));
}

function _credPeriodStatus(credit, row) {
  if (!row || row.periodo === 0) return null;
  const pagos = credit.pagos || [];
  const totalPagado = pagos.filter(p => p.periodo === row.periodo).reduce((s,p) => s + (p.monto||0), 0);
  const fechaVenc = _credParseDate(row.fecha);
  const today = new Date(); today.setHours(0,0,0,0);
  if (totalPagado > 0) {
    return totalPagado >= (row.pago||0) - 0.05 ? 'PAGADO' : 'PARCIAL';
  }
  if (!fechaVenc) return 'PENDIENTE';
  return fechaVenc < today ? 'VENCIDO' : 'PENDIENTE';
}

function _processCredits(credits) {
  if (!Array.isArray(credits)) return credits;
  const today = new Date(); today.setHours(0,0,0,0);

  return credits.map(c => {
    const amort = c.amort || [];
    const rows = amort.slice(1);
    const pagos = c.pagos || [];

    let pagado=0, parcial=0, vencido=0, pendiente=0;
    let montoVencido=0, montoPagado=0, montoPendiente=0, maxAtraso=0;
    const periodosVencidos = [];
    const periodosPagados = [];

    rows.forEach(r => {
      const st = _credPeriodStatus(c, r);
      const totalPag = pagos.filter(p => p.periodo === r.periodo).reduce((s,p) => s + (p.monto||0), 0);
      if (st === 'PAGADO')   { pagado++; montoPagado += totalPag; periodosPagados.push(r.periodo); }
      else if (st === 'PARCIAL') { parcial++; montoPagado += totalPag; montoVencido += (r.pago||0) - totalPag; }
      else if (st === 'VENCIDO') {
        vencido++;
        montoVencido += (r.pago||0);
        const f = _credParseDate(r.fecha);
        const dias = f ? Math.floor((today - f)/(86400000)) : 0;
        if (dias > maxAtraso) maxAtraso = dias;
        periodosVencidos.push({ periodo: r.periodo, fecha: r.fecha, monto: r.pago, diasAtraso: dias });
      }
      else { pendiente++; montoPendiente += (r.pago||0); }
    });

    // Saldo actual = saldo del último periodo con pago (PAGADO o PARCIAL)
    let saldoActual = c.monto || 0;
    let lastWithPayment = -1;
    for (let i = 0; i < rows.length; i++) {
      const st = _credPeriodStatus(c, rows[i]);
      if (st === 'PAGADO' || st === 'PARCIAL') lastWithPayment = i;
    }
    if (lastWithPayment >= 0) {
      const lrow = rows[lastWithPayment];
      const lst = _credPeriodStatus(c, lrow);
      if (lst === 'PAGADO') {
        saldoActual = lrow.saldo || 0;
      } else {
        const totalPag = pagos.filter(p => p.periodo === lrow.periodo).reduce((s,p) => s + (p.monto||0), 0);
        const abonoCapital = Math.max(0, totalPag - (lrow.int||0) - (lrow.ivaInt||0));
        const saldoAnterior = lastWithPayment > 0 ? (rows[lastWithPayment-1].saldo||0) : (c.monto||0);
        saldoActual = +(saldoAnterior - abonoCapital).toFixed(2);
      }
    }

    let proximoPago = null;
    for (let i = 0; i < rows.length; i++) {
      const st = _credPeriodStatus(c, rows[i]);
      if (st === 'VENCIDO' || st === 'PENDIENTE' || st === 'PARCIAL') {
        proximoPago = { periodo: rows[i].periodo, fecha: rows[i].fecha, monto: rows[i].pago };
        break;
      }
    }

    return {
      cliente: c.cl, estado: c.st, monto: c.monto, tasa: c.tasa,
      plazo: c.plazo, cat: c.cat, fechaDesembolso: c.disbDate,
      pagoFijo: rows.length > 0 ? rows[0].pago : 0,
      saldoActual: +saldoActual.toFixed(2),
      totalPeriodos: rows.length,
      cobranza: {
        pagados: pagado, parciales: parcial, vencidos: vencido, pendientes: pendiente,
        montoPagado: +montoPagado.toFixed(2), montoVencido: +montoVencido.toFixed(2),
        montoPendiente: +montoPendiente.toFixed(2), maxDiasAtraso: maxAtraso,
        periodosVencidos, periodosPagados
      },
      proximoPago,
      totalPagosRegistrados: pagos.length,
      pagosDetalle: pagos.map(p => ({ periodo: p.periodo, monto: p.monto, fecha: p.fecha }))
    };
  });
}

function extractDateParams(input) {
  const params = {};
  if (input.p_from) params.p_from = input.p_from;
  if (input.p_to)   params.p_to   = input.p_to;
  return params;
}

async function executeTool(name, input, user = {}) {
  if (!isToolAllowed(name, user)) {
    return { _access_denied: true, message: 'Tu perfil no tiene acceso a este módulo. Contacta al administrador para solicitar acceso.' };
  }
  try {
    switch (name) {
      case 'get_tpv_kpis': {
        const data = await supabaseRpc('tpv_kpis', extractDateParams(input));
        return Array.isArray(data) && data.length > 0 ? data[0] : data;
      }
      case 'get_tpv_clients_volume':
        return truncateResult(await supabaseRpc('tpv_clients_by_volume', extractDateParams(input)));
      case 'get_tpv_commissions':
        return truncateResult(await supabaseRpc('tpv_client_commissions', extractDateParams(input)));
      case 'get_tpv_agent_summary':
        return await supabaseRpc('tpv_agent_summary', extractDateParams(input));
      case 'get_tpv_terminal_status':
        return truncateResult(await supabaseRpc('tpv_terminal_status', extractDateParams(input)), 50);
      case 'get_tarjetas_kpis': {
        const data = await supabaseRpc('tar_dashboard_kpis');
        return Array.isArray(data) && data.length > 0 ? data[0] : data;
      }
      case 'get_credit_portfolio': {
        const key = input.company === 'dynamo' ? 'gf_cred_dyn' : 'gf_cred_end';
        const empresa = input.company === 'dynamo' ? 'Dynamo Finance' : 'Endless Money';
        const data = await getAppData(key);
        if (!data) return {
          _no_data: true,
          message: `No hay datos de créditos de ${empresa} disponibles en el servidor. Los datos podrían estar pendientes de sincronización. El usuario debe abrir el módulo de Créditos en el dashboard para que los datos se sincronicen con el servidor.`
        };
        const processed = _processCredits(Array.isArray(data) ? data : []);
        if (processed.length > 30) {
          return { empresa, total_creditos: processed.length, creditos: processed.slice(0, 30), _truncated: true };
        }
        return { empresa, fecha_analisis: new Date().toISOString().slice(0,10), total_creditos: processed.length, creditos: processed };
      }
      case 'get_pl_summary':
        return await getAppData('gf4') || { message: 'No hay datos de P&L' };
      case 'get_treasury_and_banks': {
        const [tesoreria, bancos] = await Promise.all([getAppData('gf_tesoreria'), getAppData('gf_bancos')]);
        return { tesoreria: tesoreria || [], bancos: bancos || [] };
      }
      case 'get_tickets':
        return truncateResult(await getAppData('gf_tickets_pagos_tpv') || []);
      case 'get_cash_flows': {
        const [fi, fg] = await Promise.all([getAppData('gf_fi'), getAppData('gf_fg')]);
        return { ingresos: fi || [], egresos: fg || [] };
      }
      case 'get_users': {
        const data = await getAppData('gf_usuarios');
        if (Array.isArray(data)) return data.map(u => ({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, activo: u.activo }));
        return data || [];
      }

      case 'analyze_credit_risk': {
        const companies = input.company === 'both' || !input.company ? ['endless', 'dynamo'] : [input.company];
        const results = {};
        for (const co of companies) {
          const key = co === 'dynamo' ? 'gf_cred_dyn' : 'gf_cred_end';
          const label = co === 'dynamo' ? 'Dynamo Finance' : 'Endless Money';
          const raw = await getAppData(key);
          if (!raw || !Array.isArray(raw)) { results[label] = { sin_datos: true }; continue; }
          const credits = _processCredits(raw).filter(c => c.estado === 'Activo' || c.estado === 'Vencido');
          const totalCartera = credits.reduce((s,c) => s + (c.monto||0), 0);
          const totalSaldo = credits.reduce((s,c) => s + (c.saldoActual||0), 0);
          const totalVencido = credits.reduce((s,c) => s + (c.cobranza.montoVencido||0), 0);
          const morosidad = totalSaldo > 0 ? +(totalVencido / totalSaldo * 100).toFixed(2) : 0;
          const concentracion = credits.map(c => ({
            cliente: c.cliente, saldo: c.saldoActual,
            pctCartera: totalSaldo > 0 ? +(c.saldoActual / totalSaldo * 100).toFixed(1) : 0
          })).sort((a,b) => b.saldo - a.saldo);
          const calificaciones = credits.map(c => {
            const v = c.cobranza.vencidos;
            const d = c.cobranza.maxDiasAtraso;
            let calif = 'A';
            if (v >= 3 || d > 90) calif = 'E';
            else if (v >= 2 || d > 60) calif = 'D';
            else if (v >= 1 && d > 30) calif = 'C';
            else if (v >= 1 || d > 0) calif = 'B';
            return { cliente: c.cliente, calificacion: calif, diasAtraso: d, periodosVencidos: v, saldo: c.saldoActual };
          });
          const dist = { A:0, B:0, C:0, D:0, E:0 };
          calificaciones.forEach(c => dist[c.calificacion]++);
          const pctReserva = { A: 0, B: 0.05, C: 0.15, D: 0.40, E: 1.0 };
          const reservaSugerida = calificaciones.reduce((s,c) => s + c.saldo * (pctReserva[c.calificacion]||0), 0);
          results[label] = {
            totalCreditos: credits.length, montoOriginalTotal: +totalCartera.toFixed(2),
            saldoVigente: +totalSaldo.toFixed(2), montoVencido: +totalVencido.toFixed(2),
            indiceMorosidad: morosidad + '%', concentracionTop5: concentracion.slice(0, 5),
            exposicionMaxima: concentracion[0] || null, distribucionRiesgo: dist,
            detalleRiesgo: calificaciones.filter(c => c.calificacion !== 'A'),
            reservaSugerida: +reservaSugerida.toFixed(2),
            criteriosReserva: '(A=0%, B=5%, C=15%, D=40%, E=100% del saldo)'
          };
        }
        return { fecha_analisis: new Date().toISOString().slice(0,10), ...results };
      }

      case 'project_cash_flow': {
        const months = Math.min(Math.max(input.months || 3, 1), 12);
        const today = new Date();
        const projections = [];
        let creditIncome = 0;
        for (const key of ['gf_cred_end', 'gf_cred_dyn']) {
          const raw = await getAppData(key);
          if (!raw || !Array.isArray(raw)) continue;
          _processCredits(raw).filter(c => c.estado === 'Activo').forEach(c => { creditIncome += (c.saldoActual || 0) * (c.tasa || 0) / 100 / 12; });
        }
        let tpvMonthlyAvg = 0;
        try {
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
          const tpvData = await supabaseRpc('tpv_kpis', { p_from: lastMonth.toISOString().slice(0,10), p_to: lastMonthEnd.toISOString().slice(0,10) });
          if (Array.isArray(tpvData) && tpvData[0]) tpvMonthlyAvg = (tpvData[0].com_salem || 0) + (tpvData[0].com_convenia || 0);
        } catch(e) { /* no TPV data */ }
        const [fi, fg] = await Promise.all([getAppData('gf_fi'), getAppData('gf_fg')]);
        let avgIngresos = 0, avgEgresos = 0;
        if (Array.isArray(fi) && fi.length > 0) avgIngresos = fi.reduce((s,r) => s + (r.monto||0), 0) / Math.max(1, new Set(fi.map(r => (r.fecha||'').substring(0,7))).size);
        if (Array.isArray(fg) && fg.length > 0) avgEgresos = fg.reduce((s,r) => s + (r.monto||0), 0) / Math.max(1, new Set(fg.map(r => (r.fecha||'').substring(0,7))).size);
        for (let i = 1; i <= months; i++) {
          const m = new Date(today.getFullYear(), today.getMonth() + i, 1);
          projections.push({
            mes: m.toISOString().slice(0,7),
            ingresosCreditos: +creditIncome.toFixed(2), ingresosTPV: +tpvMonthlyAvg.toFixed(2),
            otrosIngresos: +avgIngresos.toFixed(2),
            totalIngresos: +(creditIncome + tpvMonthlyAvg + avgIngresos).toFixed(2),
            egresos: +avgEgresos.toFixed(2),
            flujoNeto: +(creditIncome + tpvMonthlyAvg + avgIngresos - avgEgresos).toFixed(2)
          });
        }
        return { fecha_analisis: new Date().toISOString().slice(0,10), nota: 'Proyección basada en promedios históricos y pagos esperados de créditos activos', meses_proyectados: months, proyeccion: projections };
      }

      case 'compare_periods': {
        const ptype = input.period_type || 'month';
        const today = new Date();
        let currFrom, currTo, prevFrom, prevTo;
        if (ptype === 'month') {
          currFrom = new Date(today.getFullYear(), today.getMonth(), 1); currTo = today;
          prevFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1); prevTo = new Date(today.getFullYear(), today.getMonth(), 0);
        } else if (ptype === 'quarter') {
          const q = Math.floor(today.getMonth() / 3);
          currFrom = new Date(today.getFullYear(), q * 3, 1); currTo = today;
          prevFrom = new Date(today.getFullYear(), (q - 1) * 3, 1); prevTo = new Date(today.getFullYear(), q * 3, 0);
        } else {
          currFrom = new Date(today.getFullYear(), 0, 1); currTo = today;
          prevFrom = new Date(today.getFullYear() - 1, 0, 1); prevTo = new Date(today.getFullYear() - 1, 11, 31);
        }
        const fmt = d => d.toISOString().slice(0,10);
        const [currTPV, prevTPV] = await Promise.all([
          supabaseRpc('tpv_kpis', { p_from: fmt(currFrom), p_to: fmt(currTo) }).catch(() => []),
          supabaseRpc('tpv_kpis', { p_from: fmt(prevFrom), p_to: fmt(prevTo) }).catch(() => [])
        ]);
        const c = (Array.isArray(currTPV) && currTPV[0]) || {};
        const p = (Array.isArray(prevTPV) && prevTPV[0]) || {};
        const variation = (curr, prev) => {
          if (!prev || prev === 0) return { actual: curr||0, anterior: prev||0, variacion: 'N/A' };
          return { actual: curr||0, anterior: prev||0, variacion: (((curr||0) - prev) / prev * 100).toFixed(1) + '%' };
        };
        return {
          tipo_periodo: ptype, periodo_actual: `${fmt(currFrom)} a ${fmt(currTo)}`, periodo_anterior: `${fmt(prevFrom)} a ${fmt(prevTo)}`,
          tpv: { total_cobrado: variation(c.total_cobrado, p.total_cobrado), num_transacciones: variation(c.num_transacciones, p.num_transacciones), com_salem: variation(c.com_salem, p.com_salem), num_clientes: variation(c.num_clientes, p.num_clientes) }
        };
      }

      case 'get_alerts': {
        const alerts = [];
        const today = new Date(); today.setHours(0,0,0,0);
        for (const co of ['endless', 'dynamo']) {
          const key = co === 'dynamo' ? 'gf_cred_dyn' : 'gf_cred_end';
          const label = co === 'dynamo' ? 'Dynamo Finance' : 'Endless Money';
          const raw = await getAppData(key);
          if (!raw || !Array.isArray(raw)) continue;
          _processCredits(raw).forEach(c => {
            if (c.cobranza.vencidos > 0) alerts.push({ tipo: 'CRÉDITO_VENCIDO', prioridad: 'ALTA', empresa: label, cliente: c.cliente, mensaje: `${c.cobranza.vencidos} periodo(s) vencido(s), $${c.cobranza.montoVencido.toLocaleString()} pendiente, ${c.cobranza.maxDiasAtraso} días de atraso` });
            if (c.proximoPago) {
              const f = _credParseDate(c.proximoPago.fecha);
              if (f) { const dias = Math.floor((f - today) / 86400000); if (dias >= 0 && dias <= 7) alerts.push({ tipo: 'PAGO_PRÓXIMO', prioridad: 'MEDIA', empresa: label, cliente: c.cliente, mensaje: `Pago de $${(c.proximoPago.monto||0).toLocaleString()} vence en ${dias} día(s) (${c.proximoPago.fecha})` }); }
            }
          });
        }
        try {
          const thirtyAgo = new Date(today.getTime() - 30*86400000);
          const terminals = await supabaseRpc('tpv_terminal_status', { p_from: thirtyAgo.toISOString().slice(0,10), p_to: today.toISOString().slice(0,10) });
          if (Array.isArray(terminals)) terminals.forEach(t => { if ((t.dias_sin_uso || 0) > TERMINAL_INACTIVITY_DAYS) alerts.push({ tipo: 'TERMINAL_INACTIVA', prioridad: 'BAJA', empresa: 'Salem', cliente: t.cliente, mensaje: `Terminal ${t.terminal_id} sin actividad hace ${t.dias_sin_uso} días` }); });
        } catch(e) { /* skip */ }
        alerts.sort((a,b) => { const p = { ALTA: 0, MEDIA: 1, BAJA: 2 }; return (p[a.prioridad]||3) - (p[b.prioridad]||3); });
        return { fecha: new Date().toISOString().slice(0,10), total_alertas: alerts.length, alertas: alerts };
      }

      case 'simulate_credit': {
        const { monto, tasa, plazo, comision = 0 } = input;
        if (!monto || !tasa || !plazo) return { error: 'Se requiere monto, tasa y plazo' };
        const tasaMensual = tasa / 100 / 12;
        const iva = IVA_RATE;
        const pagoBase = tasaMensual > 0 ? monto * tasaMensual / (1 - Math.pow(1 + tasaMensual, -plazo)) : monto / plazo;
        const amort = [];
        let saldo = monto, totalIntereses = 0, totalIVA = 0;
        for (let i = 1; i <= plazo; i++) {
          const interes = +(saldo * tasaMensual).toFixed(2);
          const ivaInt = +(interes * iva).toFixed(2);
          const capital = +(pagoBase - interes - ivaInt).toFixed(2);
          saldo = +(saldo - capital).toFixed(2); if (saldo < 0) saldo = 0;
          totalIntereses += interes; totalIVA += ivaInt;
          amort.push({ periodo: i, pago: +pagoBase.toFixed(2), capital, interes, ivaInt, saldo });
        }
        const comMonto = monto * (comision / 100);
        const totalPagos = pagoBase * plazo;
        const cat = (((totalPagos + comMonto) / monto - 1) / (plazo / 12) * 100);
        const ingresoGrupo = totalIntereses + totalIVA + comMonto;
        const roi = (ingresoGrupo / monto * 100);
        return {
          parametros: { monto, tasa_anual: tasa + '%', plazo_meses: plazo, comision_apertura: comision + '%' },
          resultados: { pago_mensual: +pagoBase.toFixed(2), total_a_pagar: +totalPagos.toFixed(2), total_intereses: +totalIntereses.toFixed(2), total_iva_intereses: +totalIVA.toFixed(2), comision_apertura: +comMonto.toFixed(2), cat_estimado: +cat.toFixed(2) + '%', ingreso_grupo: +ingresoGrupo.toFixed(2), roi_grupo: +roi.toFixed(2) + '%' },
          tabla_amortizacion: amort.length <= 12 ? amort : { primeros_6: amort.slice(0,6), ultimos_3: amort.slice(-3), _nota: `${amort.length} periodos totales` }
        };
      }

      case 'search_client': {
        const q = (input.query || '').toLowerCase().trim();
        if (!q) return { error: 'Se requiere un término de búsqueda' };
        const results = { busqueda: input.query, encontrados: {} };
        for (const co of ['endless', 'dynamo']) {
          const key = co === 'dynamo' ? 'gf_cred_dyn' : 'gf_cred_end';
          const label = co === 'dynamo' ? 'Dynamo Finance' : 'Endless Money';
          const raw = await getAppData(key);
          if (!raw || !Array.isArray(raw)) continue;
          const matches = _processCredits(raw).filter(c => (c.cliente||'').toLowerCase().includes(q));
          if (matches.length > 0) results.encontrados[label + ' (Créditos)'] = matches;
        }
        try {
          const tpvClients = await supabaseRpc('tpv_clients_by_volume', {});
          if (Array.isArray(tpvClients)) { const matches = tpvClients.filter(c => (c.cliente||c.nombre||'').toLowerCase().includes(q)); if (matches.length > 0) results.encontrados['Salem (TPV)'] = truncateResult(matches, 10); }
        } catch(e) { /* skip */ }
        try {
          const tarData = await supabaseRpc('tar_cardholders_summary', {});
          if (Array.isArray(tarData)) { const matches = tarData.filter(c => (c.tarjetahabiente||c.subcliente||'').toLowerCase().includes(q)); if (matches.length > 0) results.encontrados['Tarjetas'] = truncateResult(matches, 10); }
        } catch(e) { /* skip */ }
        results.total_resultados = Object.values(results.encontrados).reduce((s,arr) => s + (Array.isArray(arr) ? arr.length : (arr.data||[]).length), 0);
        return results;
      }

      case 'executive_summary': {
        const [tpvKpis, tarKpis, plData, credEnd, credDyn, tesoreria] = await Promise.all([
          supabaseRpc('tpv_kpis', {}).then(d => (Array.isArray(d) && d[0]) || {}).catch(() => ({})),
          supabaseRpc('tar_dashboard_kpis').then(d => (Array.isArray(d) && d[0]) || {}).catch(() => ({})),
          getAppData('gf4').catch(() => null), getAppData('gf_cred_end').catch(() => null),
          getAppData('gf_cred_dyn').catch(() => null), getAppData('gf_tesoreria').catch(() => null)
        ]);
        const processPortfolio = (raw, label) => {
          if (!raw || !Array.isArray(raw)) return { empresa: label, sin_datos: true };
          const credits = _processCredits(raw);
          const activos = credits.filter(c => c.estado === 'Activo' || c.estado === 'Vencido');
          return { empresa: label, total_creditos: credits.length, activos: activos.length, saldo_total: +activos.reduce((s,c) => s + c.saldoActual, 0).toFixed(2), monto_vencido: +activos.reduce((s,c) => s + c.cobranza.montoVencido, 0).toFixed(2), creditos_con_atraso: activos.filter(c => c.cobranza.vencidos > 0).length };
        };
        return {
          fecha: new Date().toISOString().slice(0,10),
          tpv_salem: { total_cobrado: tpvKpis.total_cobrado || 0, comision_salem: tpvKpis.com_salem || 0, num_clientes: tpvKpis.num_clientes || 0, num_transacciones: tpvKpis.num_transacciones || 0 },
          tarjetas: { total_transacciones: tarKpis.total_transacciones || 0, monto_total: tarKpis.monto_total || 0, tarjetas_activas: tarKpis.tarjetas_activas || 0, tasa_rechazo: tarKpis.tasa_rechazo || 0 },
          creditos: { endless: processPortfolio(credEnd, 'Endless Money'), dynamo: processPortfolio(credDyn, 'Dynamo Finance') },
          tesoreria_resumen: Array.isArray(tesoreria) ? { total_movimientos: tesoreria.length, ingresos: +tesoreria.filter(t => (t.tipo||'').toLowerCase() === 'ingreso').reduce((s,t) => s + (t.monto||0), 0).toFixed(2), egresos: +tesoreria.filter(t => (t.tipo||'').toLowerCase() === 'egreso').reduce((s,t) => s + (t.monto||0), 0).toFixed(2) } : { sin_datos: true },
          pl_disponible: !!plData
        };
      }

      case 'analyze_trends': {
        const area = input.area || 'all';
        const trends = {};
        const today = new Date();
        if (area === 'tpv' || area === 'all') {
          const monthlyTPV = [];
          for (let i = 5; i >= 0; i--) {
            const from = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const to = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
            try {
              const d = await supabaseRpc('tpv_kpis', { p_from: from.toISOString().slice(0,10), p_to: to.toISOString().slice(0,10) });
              const kpi = (Array.isArray(d) && d[0]) || {};
              monthlyTPV.push({ mes: from.toISOString().slice(0,7), cobrado: kpi.total_cobrado || 0, comision_salem: kpi.com_salem || 0, transacciones: kpi.num_transacciones || 0, clientes: kpi.num_clientes || 0 });
            } catch(e) { monthlyTPV.push({ mes: from.toISOString().slice(0,7), sin_datos: true }); }
          }
          for (let i = 1; i < monthlyTPV.length; i++) {
            const prev = monthlyTPV[i-1].cobrado, curr = monthlyTPV[i].cobrado;
            monthlyTPV[i].crecimiento = prev > 0 ? +((curr - prev) / prev * 100).toFixed(1) + '%' : 'N/A';
          }
          trends.tpv = { ultimos_6_meses: monthlyTPV };
        }
        if (area === 'credits' || area === 'all') {
          const portfolioStatus = {};
          for (const co of ['endless', 'dynamo']) {
            const key = co === 'dynamo' ? 'gf_cred_dyn' : 'gf_cred_end';
            const label = co === 'dynamo' ? 'Dynamo Finance' : 'Endless Money';
            const raw = await getAppData(key);
            if (!raw || !Array.isArray(raw)) continue;
            const credits = _processCredits(raw);
            const activos = credits.filter(c => c.estado === 'Activo' || c.estado === 'Vencido');
            const totalColocado = credits.reduce((s,c) => s + (c.monto||0), 0);
            const saldoActual = activos.reduce((s,c) => s + c.saldoActual, 0);
            const capitalRecuperado = totalColocado - saldoActual;
            portfolioStatus[label] = { total_colocado: +totalColocado.toFixed(2), saldo_vigente: +saldoActual.toFixed(2), capital_recuperado: +capitalRecuperado.toFixed(2), pct_recuperado: totalColocado > 0 ? +(capitalRecuperado/totalColocado*100).toFixed(1)+'%' : '0%', morosidad: activos.filter(c => c.cobranza.vencidos > 0).length + ' de ' + activos.length + ' créditos' };
          }
          trends.creditos = portfolioStatus;
        }
        if (area === 'treasury' || area === 'all') {
          const [fi, fg] = await Promise.all([getAppData('gf_fi'), getAppData('gf_fg')]);
          if (Array.isArray(fi) || Array.isArray(fg)) {
            const monthlyFlow = {};
            (fi||[]).forEach(r => { const m = (r.fecha||'').substring(0,7); if (!m) return; if (!monthlyFlow[m]) monthlyFlow[m] = { ingresos: 0, egresos: 0 }; monthlyFlow[m].ingresos += (r.monto||0); });
            (fg||[]).forEach(r => { const m = (r.fecha||'').substring(0,7); if (!m) return; if (!monthlyFlow[m]) monthlyFlow[m] = { ingresos: 0, egresos: 0 }; monthlyFlow[m].egresos += (r.monto||0); });
            const sorted = Object.entries(monthlyFlow).sort((a,b) => a[0].localeCompare(b[0])).slice(-6);
            trends.flujo_efectivo = sorted.map(([mes, d]) => ({ mes, ingresos: +d.ingresos.toFixed(2), egresos: +d.egresos.toFixed(2), neto: +(d.ingresos - d.egresos).toFixed(2) }));
          }
        }
        return { fecha_analisis: new Date().toISOString().slice(0,10), area_analizada: area, tendencias: trends };
      }

      default:
        return { error: 'Tool no reconocida: ' + name };
    }
  } catch (e) {
    console.error('[Tool] Execution error in', name, ':', e.message);
    return { error: 'Error ejecutando herramienta: ' + e.message };
  }
}

module.exports = { executeTool, _processCredits, truncateResult };
