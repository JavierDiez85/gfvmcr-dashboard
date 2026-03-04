// GF — Helpers globales (toast, fmt, modals)

// STATE
// ═══════════════════════════════════════
let S = { recs: [], excelData: null };
let _year = 2026;
let _currentView = 'inicio';
const CH = {};
const dc = id => { if(CH[id]){ CH[id].destroy(); delete CH[id]; } };

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

Chart.defaults.font.family="'Figtree',sans-serif";
Chart.defaults.font.size=11;
Chart.defaults.color='#8b8fb5';
Chart.defaults.borderColor='#e4e8f4';

// ═══════════════════════════════════════
// UTILS
// ═══════════════════════════════════════
const sum = a=>a.reduce((x,y)=>(x+(+y||0)),0);
const MO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

/** Period column grouping utility — shared by EDO, P&L, Dashboard charts */
function periodColumns(mode) {
  if (mode === 'anual') return {
    cols: [Array(12).fill(0).map((_,i)=>i)],
    colLabels: ['Total ' + _year]
  };
  if (mode === 'trimestral') {
    const qs = [[0,1,2],[3,4,5],[6,7,8],[9,10,11]];
    return { cols: [...qs, Array(12).fill(0).map((_,i)=>i)], colLabels: ['Q1','Q2','Q3','Q4','Total'] };
  }
  return { cols: Array(12).fill(0).map((_,i)=>[i]), colLabels: [...MO, 'Total'] };
}
const colVal = (arr, idxs) => idxs.reduce((a,i) => a + (arr[i]||0), 0);
function fmt(n,d=0){
  if(n==null||isNaN(n)) return '—';
  const neg=n<0,a=Math.abs(n),s=(neg?'-':'')+'$';
  if(a>=1000000) return s+(a/1000000).toFixed(1)+'M';
  if(a>=1000) return s+(a/1000).toFixed(a>=10000?0:1)+'K';
  return s+a.toFixed(d);
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
