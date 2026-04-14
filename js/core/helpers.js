// GF — Helpers globales (toast, fmt, modals)

// STATE
// ═══════════════════════════════════════
let S = { recs: [], excelData: null };
let _year = new Date().getFullYear();
let _gfPeriod = {}; // {ent: 'año'|'q1'|'q2'|'q3'|'q4'|'mes_0'..'mes_11'}
let _gfCompare = false; // true cuando "vs Año Anterior" está activo

// Return array of month indices [0..11] for the active period of an entity
// Supports: 'año', 'todo', 'q1'-'q4', 'mes_N', 'rango_N_M'
function _periodIdxs(ent) {
  var mode = (typeof _gfPeriod !== 'undefined' ? _gfPeriod[ent] : null) || 'año';
  if(mode === 'todo') return [0,1,2,3,4,5,6,7,8,9,10,11]; // same as 'año' but signals multi-year
  if(mode.startsWith('mes_')) return [parseInt(mode.split('_')[1])];
  if(mode.startsWith('rango_')){
    var parts = mode.split('_');
    var from = parseInt(parts[1]), to = parseInt(parts[2]);
    var idxs = [];
    for(var i = from; i <= to; i++) idxs.push(i);
    return idxs;
  }
  var qMap = { q1:[0,1,2], q2:[3,4,5], q3:[6,7,8], q4:[9,10,11] };
  if(qMap[mode]) return qMap[mode];
  return [0,1,2,3,4,5,6,7,8,9,10,11];
}
// Sum only the filtered months from a 12-element array
function _periodSum(vals, ent) {
  var idxs = _periodIdxs(ent);
  return idxs.reduce(function(s, i){ return s + (vals[i]||0); }, 0);
}
let _currentView = 'inicio';
const CH = {};
const dc = id => { if(CH[id]){ CH[id].destroy(); delete CH[id]; } };

// ── Cleanup: destruir TODOS los charts al cambiar de vista ──
function destroyAllCharts(){
  // 1. CH — P&L, chart-helpers, cobranza, pl-engine
  Object.keys(CH).forEach(k => { try{ CH[k].destroy(); }catch(e){} delete CH[k]; });
  // 2. TPV_CHARTS
  if(typeof TPV_CHARTS !== 'undefined' && TPV_CHARTS){
    Object.keys(TPV_CHARTS).forEach(k => { try{ TPV_CHARTS[k].destroy(); }catch(e){} delete TPV_CHARTS[k]; });
  }
  // 3. TAR_CHARTS
  if(typeof TAR_CHARTS !== 'undefined' && TAR_CHARTS){
    Object.keys(TAR_CHARTS).forEach(k => { try{ TAR_CHARTS[k].destroy(); }catch(e){} delete TAR_CHARTS[k]; });
  }
  // 4. TES_CHARTS
  if(typeof TES_CHARTS !== 'undefined' && TES_CHARTS){
    Object.keys(TES_CHARTS).forEach(k => { try{ TES_CHARTS[k].destroy(); }catch(e){} delete TES_CHARTS[k]; });
  }
  // 5. BOVEDA_CHARTS
  if(typeof BOVEDA_CHARTS !== 'undefined' && BOVEDA_CHARTS){
    Object.keys(BOVEDA_CHARTS).forEach(k => { try{ BOVEDA_CHARTS[k].destroy(); }catch(e){} delete BOVEDA_CHARTS[k]; });
  }
  // 6. CASINO_CHARTS
  if(typeof CASINO_CHARTS !== 'undefined' && CASINO_CHARTS){
    Object.keys(CASINO_CHARTS).forEach(k => { try{ CASINO_CHARTS[k].destroy(); }catch(e){} delete CASINO_CHARTS[k]; });
  }
  // 6. Sueltos
  if(window._dashTesChart){ try{ window._dashTesChart.destroy(); }catch(e){} window._dashTesChart = null; }
}

// ── Seguridad: Escape HTML para prevenir XSS ──
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
var _esc = escapeHtml;

// ── Debounce: evita ejecución excesiva en inputs de búsqueda ──
function _debounce(fn, ms){
  var timer;
  return function(){
    var ctx = this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function(){ fn.apply(ctx, args); }, ms);
  };
}
// Wrappers debounced para filtros de búsqueda (150ms)
var _dFilterTPV = _debounce(function(tbodyId, q){ if(typeof filterTPVTable==='function') filterTPVTable(tbodyId, q); }, 150);
var _dCobrFilter = _debounce(function(q){ if(typeof cobrFilter==='function') cobrFilter(q); }, 150);
var _dDynCobrFilter = _debounce(function(q){ if(typeof dynCobrFilter==='function') dynCobrFilter(q); }, 150);

Chart.defaults.font.family="'Figtree',sans-serif";
Chart.defaults.font.size=11;
Chart.defaults.color='#8b8fb5';
Chart.defaults.borderColor='#e4e8f4';

// ═══════════════════════════════════════
// UTILS
// ═══════════════════════════════════════
const sum = a=>a.reduce((x,y)=>(x+(+y||0)),0);
const MO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

/** Period column grouping utility — shared by EDO, P&L, sub-views */
function periodColumns(mode) {
  const m = mode || 'año';
  // ── Single month: 'mes_0'..'mes_11' ──
  if(m.startsWith('mes_')) {
    const mi = parseInt(m.split('_')[1]);
    return { cols: [[mi]], colLabels: [MO[mi]] };
  }
  // ── Individual quarter: 3 month columns + quarter total ──
  const qMap = { q1:[0,1,2], q2:[3,4,5], q3:[6,7,8], q4:[9,10,11] };
  if(qMap[m]) {
    const qs = qMap[m];
    return { cols: [...qs.map(i=>[i]), qs], colLabels: [...qs.map(i=>MO[i]), m.toUpperCase()] };
  }
  // ── Legacy: single total column ('anual') ──
  if(m === 'anual') return {
    cols: [Array(12).fill(0).map((_,i)=>i)],
    colLabels: ['Total ' + _year]
  };
  // ── Legacy: 4 quarter groups + total ('trimestral') ──
  if(m === 'trimestral') {
    const qs = [[0,1,2],[3,4,5],[6,7,8],[9,10,11]];
    return { cols: [...qs, Array(12).fill(0).map((_,i)=>i)], colLabels: ['Q1','Q2','Q3','Q4','Total'] };
  }
  // ── Default 'año' / 'mensual': 12 month columns + total ──
  return { cols: Array(12).fill(0).map((_,i)=>[i]), colLabels: [...MO, 'Total'], addTotal: true };
}
const colVal = (arr, idxs) => idxs.reduce((a,i) => a + (arr[i]||0), 0);
function fmt(n,d=0){
  if(n==null||isNaN(n)) return '—';
  const neg=n<0,a=Math.abs(n);
  return(neg?'-':'')+'$'+a.toLocaleString('es-MX',{minimumFractionDigits:d,maximumFractionDigits:d});
}
function fmtFull(n){
  if(n==null||isNaN(n)) return '—';
  return (n<0?'-':'')+'$'+Math.abs(n).toLocaleString('es-MX');
}
function pct(p){ return p==null||isNaN(p)?'—':(p*100).toFixed(1)+'%'; }

function statusPill(st){
  const c = st==='Activo'?['#007a48','#c2f0da'] : st.includes('VENCIDO')?['#b02020','#fcc'] : ['#7a6000','#ffe0a0'];
  return `<span class="status-pill" style="color:${c[0]};background:${c[1]}">${st}</span>`;
}

function cOpts(extra={}){
  return {responsive:true,maintainAspectRatio:true,
    plugins:{
      legend:{labels:{color:'#8b8fb5',font:{size:11},boxWidth:10,padding:12}},
      tooltip:{backgroundColor:'rgba(26,28,46,.93)',borderColor:'rgba(255,255,255,.1)',borderWidth:1,titleColor:'#fff',bodyColor:'#c5c7e0',padding:9,
        callbacks:{label:ctx=>' '+ctx.dataset.label+': '+(typeof ctx.raw==='number'?fmtFull(ctx.raw):ctx.raw)}}
    },
    scales:{
      x:{grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:11}}},
      y:{grid:{color:'rgba(228,232,244,.7)'},ticks:{color:'#b0b4d0',font:{size:11},callback:v=>'$'+Math.abs(v/1000).toFixed(0)+'K'}}
    },...extra};
}

// ═══════════════════════════════════════
// MONTH INPUT BUILDER
// ═══════════════════════════════════════
function mkMo(ids,pref){
  [[0,1,2,3],[4,5,6,7],[8,9,10,11]].forEach((ch,ci)=>{
    const el = document.getElementById(ids[ci]);
    if(!el) return;
    el.innerHTML=ch.map(i=>
      `<div class="fg"><label class="fl">${MO[i]}</label><input class="fi n" id="${pref}${i}" type="number" placeholder="0" step="100"></div>`
    ).join('');
  });
}
// mkMo legacy removed — inputs now in Flujo de Ingresos/Gastos tables

// UI HELPERS
// ═══════════════════════════════════════
function sp(btn,p){ document.querySelectorAll('.pbtn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }
function toast(m){ const t=document.getElementById('toast'); t.textContent=m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),3200); }

// INIT — ahora manejado por initApp() en supabase.js
// La secuencia de init se ejecuta después de jalar datos de Supabase

// ═══════════════════════════════════════
