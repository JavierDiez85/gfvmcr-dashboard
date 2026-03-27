// GF — Creditos: Engine (calculo puro + helpers)
(function(window) {
  'use strict';

  // ── Constants ──
  let CC_PREVIEW = [];   // creditos extraidos pendientes de importar
  let CC_HISTORY = [];   // historial de cargas

  // ── Helpers de calculo ──
  function credIntMes(c){
    if(!c.monto||!c.tasa) return 0;
    // If amortization table exists, use first period interest
    if(c.amort && c.amort.length>1) return c.amort[1].int||0;
    return c.monto * (c.tasa/100) / 12;
  }
  function credComApertura(c){ return c.monto*(c.com||0)/100; }
  function credIngAnual(c){
    if(c.amort && c.amort.length>1){
      return c.amort.slice(1).reduce((s,r)=>s+(r.int||0)+(r.ivaInt||0),0);
    }
    return credIntMes(c)*12 + credComApertura(c);
  }
  function credSaldoActual(c){
    // Saldo = saldo del último periodo con pago (PAGADO o PARCIAL), o monto original
    if(!c.amort || c.amort.length<=1) return c.monto||0;
    let lastWithPayment = 0;
    for(let i=1; i<c.amort.length; i++){
      const st = credPeriodStatus(c, c.amort[i]);
      if(st === 'PAGADO' || st === 'PARCIAL') lastWithPayment = i;
    }
    if(lastWithPayment === 0) return c.amort[0].saldo || c.monto || 0;
    const row = c.amort[lastWithPayment];
    const st = credPeriodStatus(c, row);
    if(st === 'PAGADO') return row.saldo || 0;
    // PARCIAL: saldo del periodo anterior menos lo que sí se abonó a capital
    const totalPag = credTotalPagadoPeriodo(c, row.periodo);
    const intPeriodo = row.int || 0;
    const ivaPeriodo = row.ivaInt || 0;
    const abonoCapital = Math.max(0, totalPag - intPeriodo - ivaPeriodo);
    const saldoAnterior = lastWithPayment > 1 ? (c.amort[lastWithPayment-1].saldo||0) : (c.monto||0);
    return +(saldoAnterior - abonoCapital).toFixed(2);
  }
  function credPagoFijo(c){
    if(c.amort && c.amort.length>1) return c.amort[1].pago||0;
    return 0;
  }
  function credTotalPagos(c){
    if(c.amort) return c.amort.slice(1).reduce((s,r)=>s+(r.pago||0),0);
    return 0;
  }
  function credTotalIntereses(c){
    if(c.amort) return c.amort.slice(1).reduce((s,r)=>s+(r.int||0),0);
    return 0;
  }

  // ── Helpers de fecha DD/MM/YYYY o DD/Mon/YYYY ──
  const _MESES_MAP = {ene:0,feb:1,mar:2,abr:3,apr:3,may:4,jun:5,jul:6,ago:7,aug:7,sep:8,oct:9,nov:10,dic:11,dec:11};
  function credParseDate(str){
    if(!str) return null;
    const p = str.split('/');
    if(p.length!==3) return null;
    let mes = parseInt(p[1]);
    if(isNaN(mes)){
      mes = _MESES_MAP[p[1].toLowerCase().substring(0,3)];
      if(mes===undefined) return null;
    } else { mes--; }
    return new Date(parseInt(p[2]), mes, parseInt(p[0]));
  }
  function credFormatDate(d){
    if(!d) return '';
    return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
  }

  // ── Estatus de pago por periodo ──
  function credPeriodStatus(credit, row){
    if(!row || row.periodo===0) return null;
    const pagos = credit.pagos || [];
    // Suma TODOS los pagos del mismo periodo (soporta pagos complementarios)
    const totalPagado = pagos.filter(p => p.periodo === row.periodo).reduce((s,p) => s + (p.monto||0), 0);
    const fechaVenc = credParseDate(row.fecha);
    const today = new Date(); today.setHours(0,0,0,0);

    if(totalPagado > 0){
      // Tolerancia de $0.05 para diferencias de redondeo
      return totalPagado >= (row.pago||0) - 0.05 ? 'PAGADO' : 'PARCIAL';
    }
    if(!fechaVenc) return 'PENDIENTE';
    return fechaVenc < today ? 'VENCIDO' : 'PENDIENTE';
  }

  // Suma todos los pagos registrados para un periodo (para mostrar en UI)
  function credTotalPagadoPeriodo(credit, periodo){
    return (credit.pagos||[]).filter(p => p.periodo === periodo).reduce((s,p) => s + (p.monto||0), 0);
  }

  function credDiasAtraso(row){
    const f = credParseDate(row.fecha);
    if(!f) return 0;
    const today = new Date(); today.setHours(0,0,0,0);
    const diff = Math.floor((today - f)/(1000*60*60*24));
    return diff > 0 ? diff : 0;
  }

  function credCobranzaResumen(credit){
    if(!credit.amort || credit.amort.length<=1) return null;
    const rows = credit.amort.slice(1);
    let pagado=0, parcial=0, vencido=0, pendiente=0;
    let montoVencido=0, montoPagado=0, montoPendiente=0, maxAtraso=0;
    const pagos = credit.pagos || [];

    rows.forEach(r=>{
      const st = credPeriodStatus(credit, r);
      const totalPagR = credTotalPagadoPeriodo(credit, r.periodo);
      if(st==='PAGADO')   { pagado++;  montoPagado += totalPagR; }
      else if(st==='PARCIAL'){ parcial++; montoPagado += totalPagR; montoVencido += (r.pago||0) - totalPagR; }
      else if(st==='VENCIDO'){ vencido++; montoVencido += (r.pago||0); maxAtraso = Math.max(maxAtraso, credDiasAtraso(r)); }
      else { pendiente++; montoPendiente += (r.pago||0); }
    });
    return { pagado, parcial, vencido, pendiente, montoVencido, montoPagado, montoPendiente, maxAtraso, total:rows.length };
  }

  function credProximoPago(credit){
    if(!credit.amort || credit.amort.length<=1) return null;
    for(let i=1;i<credit.amort.length;i++){
      const st = credPeriodStatus(credit, credit.amort[i]);
      if(st==='VENCIDO'||st==='PENDIENTE'||st==='PARCIAL') return credit.amort[i];
    }
    return null;
  }

  // Expose globals
  window.CC_PREVIEW  = CC_PREVIEW;
  window.CC_HISTORY  = CC_HISTORY;
  window.credIntMes  = credIntMes;
  window.credComApertura = credComApertura;
  window.credIngAnual    = credIngAnual;
  window.credSaldoActual = credSaldoActual;
  window.credPagoFijo    = credPagoFijo;
  window.credTotalPagos  = credTotalPagos;
  window.credTotalIntereses = credTotalIntereses;
  window.credParseDate   = credParseDate;
  window.credFormatDate  = credFormatDate;
  window.credPeriodStatus = credPeriodStatus;
  window.credTotalPagadoPeriodo = credTotalPagadoPeriodo;
  window.credDiasAtraso  = credDiasAtraso;
  window.credCobranzaResumen = credCobranzaResumen;
  window.credProximoPago = credProximoPago;

})(window);
