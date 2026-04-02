// GF — Stellaris Casino: Dashboard
(function(window) {
  'use strict';

  const CASINO_CHARTS = {};

  let _casinoFilter = 'todo'; // active filter

  function _casinoDateRange(filter) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const fmt2 = d => d.toISOString().slice(0,10);
    const to = fmt2(today);

    switch(filter) {
      case 'hoy': return { from: to, to, label: 'Hoy' };
      case 'ayer': {
        const y = new Date(today); y.setDate(y.getDate()-1);
        return { from: fmt2(y), to: fmt2(y), label: 'Ayer' };
      }
      case 'semana': {
        const w = new Date(today); w.setDate(w.getDate()-6);
        return { from: fmt2(w), to, label: 'Últimos 7 días' };
      }
      case 'mes': {
        const m = new Date(today.getFullYear(), today.getMonth(), 1);
        return { from: fmt2(m), to, label: 'Este mes' };
      }
      case 'trimestre': {
        const q = new Date(today.getFullYear(), Math.floor(today.getMonth()/3)*3, 1);
        return { from: fmt2(q), to, label: 'Este trimestre' };
      }
      case 'semestre': {
        const s = new Date(today.getFullYear(), today.getMonth() < 6 ? 0 : 6, 1);
        return { from: fmt2(s), to, label: 'Este semestre' };
      }
      case 'anual': {
        const a = new Date(today.getFullYear(), 0, 1);
        return { from: fmt2(a), to, label: String(today.getFullYear()) };
      }
      default: return { from: null, to: null, label: 'Todo el historial' };
    }
  }

  function _setCasinoFilter(filter) {
    _casinoFilter = filter;
    rCasinoDashboard();
  }

  function rCasinoDashboard() {
    const el = document.getElementById('view-stel_casino');
    if (!el) return;

    const range = _casinoDateRange(_casinoFilter);
    const data = casinoLoad();
    const allCortes = data.cortes || [];
    const cortes = casinoCortes(range.from, range.to);
    const kpis = casinoKPIs(range.from, range.to) || {};

    // Last corte in filtered range
    const last = cortes[0] || {};

    // Filter bar
    const filters = [
      {id:'hoy',label:'Hoy'},{id:'ayer',label:'Ayer'},{id:'semana',label:'Semana'},
      {id:'mes',label:'Mes'},{id:'trimestre',label:'Trimestre'},{id:'semestre',label:'Semestre'},
      {id:'anual',label:'Año'},{id:'todo',label:'Todo'}
    ];
    const filterBar = filters.map(f => {
      const isActive = _casinoFilter === f.id;
      return `<button class="pbtn casino-filter-btn${isActive?' active':''}" data-filter="${f.id}" style="${isActive?'background:#e53935;color:white;border-color:#e53935;':''}font-size:.68rem;padding:3px 10px">${f.label}</button>`;
    }).join('');

    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-family:'Poppins',sans-serif;font-size:.95rem;font-weight:700">🎰 Casino Stellaris — Dashboard</div>
          <div style="font-size:.68rem;color:var(--muted);margin-top:2px">${last.sala || 'Grand Tuxtla Casino'} · ${range.label} · ${cortes.length} corte${cortes.length!==1?'s':''}</div>
        </div>
        <div style="display:flex;gap:3px;flex-wrap:wrap">${filterBar}</div>
      </div>

      <!-- KPIs -->
      <div class="kpi-row" style="margin-bottom:14px">
        <div class="kpi-card" style="--ac:var(--green)">
          <div class="kpi-top"><div class="kpi-lbl">Netwin Total</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">💰</div></div>
          <div class="kpi-val" style="color:var(--green)">${fmt(kpis.total_netwin || 0)}</div>
          <div class="kpi-d dup">Ganancia neta acumulada</div>
        </div>
        <div class="kpi-card" style="--ac:#e53935">
          <div class="kpi-top"><div class="kpi-lbl">Resultado Caja</div><div class="kpi-ico" style="background:var(--red-bg);color:#e53935">🏦</div></div>
          <div class="kpi-val" style="color:#e53935">${fmt(kpis.total_resultado || 0)}</div>
          <div class="kpi-d dnu">Entradas - Salidas</div>
        </div>
        <div class="kpi-card" style="--ac:var(--blue)">
          <div class="kpi-top"><div class="kpi-lbl">Hold Promedio</div><div class="kpi-ico" style="background:var(--blue-bg);color:var(--blue)">📊</div></div>
          <div class="kpi-val" style="color:var(--blue)">${kpis.avg_hold ? kpis.avg_hold.toFixed(2) + '%' : '—'}</div>
          <div class="kpi-d dnu">% retención de máquinas</div>
        </div>
        <div class="kpi-card" style="--ac:var(--purple)">
          <div class="kpi-top"><div class="kpi-lbl">Jugado Total</div><div class="kpi-ico" style="background:var(--purple-bg);color:var(--purple)">🎰</div></div>
          <div class="kpi-val" style="color:var(--purple)">${fmt(kpis.total_jugado || 0)}</div>
          <div class="kpi-d dnu">${kpis.total_terminales || 0} terminales</div>
        </div>
      </div>

      <!-- Second row KPIs -->
      <div class="kpi-row c3" style="margin-bottom:14px">
        <div class="kpi-card" style="--ac:var(--orange)">
          <div class="kpi-top"><div class="kpi-lbl">Ocupación</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">👥</div></div>
          <div class="kpi-val" style="color:var(--orange)">${kpis.avg_ocupacion ? kpis.avg_ocupacion.toFixed(1) + '%' : '—'}</div>
          <div class="kpi-d dnu">${kpis.total_aforo || 0} personas total</div>
        </div>
        <div class="kpi-card" style="--ac:var(--green)">
          <div class="kpi-top"><div class="kpi-lbl">Cuentas Nuevas</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">📈</div></div>
          <div class="kpi-val" style="color:var(--green)">${kpis.total_altas || 0}</div>
          <div class="kpi-d dup">Altas en el periodo</div>
        </div>
        <div class="kpi-card" style="--ac:var(--muted)">
          <div class="kpi-top"><div class="kpi-lbl">Cortes</div><div class="kpi-ico" style="background:var(--bg);color:var(--muted)">📋</div></div>
          <div class="kpi-val">${kpis.num_cortes || 0}</div>
          <div class="kpi-d dnu">reportes cargados</div>
        </div>
      </div>

      <!-- Charts row -->
      <div class="g2" style="margin-bottom:14px">
        <div class="cc">
          <div class="cc-h"><div><div class="cc-t">Netwin por Proveedor</div><div class="cc-s">Último corte</div></div></div>
          <div class="cc-b"><canvas id="c-casino-prov" height="200"></canvas></div>
        </div>
        <div class="cc">
          <div class="cc-h"><div><div class="cc-t">Hold% por Proveedor</div><div class="cc-s">Último corte</div></div></div>
          <div class="cc-b"><canvas id="c-casino-hold" height="200"></canvas></div>
        </div>
      </div>

      <!-- Last corte detail -->
      ${last.fecha ? `
        <div class="tw" style="margin-bottom:14px">
          <div class="tw-h"><div class="tw-ht">📊 Último Corte — ${escapeHtml(last.fecha)} ${escapeHtml(last.turno||'')}</div></div>
          <div style="overflow-x:auto">
            <table class="bt">
              <thead><tr>
                <th>Proveedor</th><th class="r">Jugado</th><th class="r">Netwin</th>
                <th class="r">Hold%</th><th class="r">Terminales</th><th class="r">Netwin/Term.</th>
              </tr></thead>
              <tbody>
                ${(last.proveedores||[]).map(p => `<tr>
                  <td class="bld">${escapeHtml(p.nombre)}</td>
                  <td class="mo">${fmt(p.jugado)}</td>
                  <td class="mo pos bld">${fmt(p.netwin)}</td>
                  <td class="mo">${p.hold.toFixed(2)}%</td>
                  <td class="mo">${p.terminales}</td>
                  <td class="mo">${fmt(p.netwin_terminal || (p.terminales ? p.netwin/p.terminales : 0))}</td>
                </tr>`).join('')}
                <tr style="font-weight:700;border-top:2px solid var(--border2)">
                  <td>TOTAL</td>
                  <td class="mo">${fmt(last.jugado)}</td>
                  <td class="mo pos">${fmt(last.netwin)}</td>
                  <td class="mo">${last.hold_pct ? last.hold_pct.toFixed(2)+'%' : '—'}</td>
                  <td class="mo">${last.terminales}</td>
                  <td class="mo">${fmt(last.netwin_terminal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ` : '<div style="text-align:center;color:var(--muted);padding:40px">Sin datos. Sube el primer corte PDF en la sección de Carga de Datos.</div>'}

      <!-- Cajeros (if available) -->
      ${(last.cajeros && last.cajeros.length) ? `
        <div class="tw">
          <div class="tw-h"><div class="tw-ht">👥 Control de Caja — Cajeros (${last.cajeros.length})</div></div>
          <div style="overflow-x:auto">
            <table class="bt">
              <thead><tr>
                <th>Cajero</th><th class="r">Entradas</th><th class="r">Salidas</th>
                <th class="r">Impuestos</th><th class="r">Resultado</th><th class="r">Depósitos</th>
              </tr></thead>
              <tbody>
                ${last.cajeros.map(c => `<tr>
                  <td class="bld">${escapeHtml(c.nombre)}</td>
                  <td class="mo">${fmt(c.entradas)}</td>
                  <td class="mo neg">${fmt(c.salidas)}</td>
                  <td class="mo">${fmt(c.impuestos)}</td>
                  <td class="mo pos bld">${fmt(c.resultado)}</td>
                  <td class="mo">${fmt(c.depositos)}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `;

    // Wire filter buttons
    el.querySelectorAll('.casino-filter-btn').forEach(btn => {
      btn.addEventListener('click', function(){ _setCasinoFilter(this.dataset.filter); });
    });

    // Render charts
    if (last.proveedores && last.proveedores.length) {
      setTimeout(() => _renderCasinoCharts(last), 80);
    }
  }

  function _renderCasinoCharts(corte) {
    const isDark = document.body.classList.contains('dark');
    const tc = isDark ? '#9da0c5' : '#8b8fb5';
    const gc = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
    const provs = corte.proveedores || [];
    const colors = ['#0073ea', '#00b875', '#ff7043', '#9b51e0', '#ffa000', '#e53935', '#607D8B'];

    // Netwin by provider (bar)
    const netwinCanvas = document.getElementById('c-casino-prov');
    if (netwinCanvas) {
      if (CASINO_CHARTS['prov']) CASINO_CHARTS['prov'].destroy();
      CASINO_CHARTS['prov'] = new Chart(netwinCanvas, {
        type: 'bar',
        data: {
          labels: provs.map(p => p.nombre),
          datasets: [{
            label: 'Netwin',
            data: provs.map(p => p.netwin),
            backgroundColor: provs.map((_, i) => colors[i % colors.length] + 'CC'),
            borderColor: provs.map((_, i) => colors[i % colors.length]),
            borderWidth: 1.5,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: tc, font: { size: 10 } } },
            y: { grid: { color: gc }, ticks: { color: tc, font: { size: 9 }, callback: v => '$' + Math.round(v).toLocaleString('es-MX') } }
          }
        }
      });
    }

    // Hold% by provider (horizontal bar)
    const holdCanvas = document.getElementById('c-casino-hold');
    if (holdCanvas) {
      if (CASINO_CHARTS['hold']) CASINO_CHARTS['hold'].destroy();
      CASINO_CHARTS['hold'] = new Chart(holdCanvas, {
        type: 'bar',
        data: {
          labels: provs.map(p => p.nombre),
          datasets: [{
            label: 'Hold %',
            data: provs.map(p => p.hold),
            backgroundColor: provs.map(p => p.hold >= 15 ? '#00b87588' : p.hold >= 8 ? '#ffa00088' : '#e5393588'),
            borderColor: provs.map(p => p.hold >= 15 ? '#00b875' : p.hold >= 8 ? '#ffa000' : '#e53935'),
            borderWidth: 1.5,
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gc }, ticks: { color: tc, font: { size: 9 }, callback: v => v + '%' } },
            y: { grid: { display: false }, ticks: { color: tc, font: { size: 10 } } }
          }
        }
      });
    }
  }

  // ═══════════════════════════════════════
  // P&L INJECTION — Auto-inject casino netwin
  // ═══════════════════════════════════════
  function fiInjectCasino() {
    if (typeof FI_ROWS === 'undefined' || typeof _year === 'undefined') return;

    // Remove previous casino auto rows
    FI_ROWS = FI_ROWS.filter(r => !r.autoCasino);

    const monthly = casinoMonthlyNetwin(_year);
    const hasData = monthly.some(v => v > 0);
    if (!hasData) return;

    FI_ROWS.unshift({
      id: 'casino_netwin_' + _year,
      concepto: 'Casino — Netwin Máquinas (auto)',
      ent: 'Stellaris',
      cat: 'Máquinas Net Win',
      yr: String(_year),
      vals: monthly.map(v => Math.round(v)),
      auto: true,
      autoCasino: true
    });
  }

  // ═══════════════════════════════════════
  // EXPOSE + REGISTER
  // ═══════════════════════════════════════
  window.rCasinoDashboard = rCasinoDashboard;
  window._setCasinoFilter = _setCasinoFilter;
  window.fiInjectCasino = fiInjectCasino;
  window.CASINO_CHARTS = CASINO_CHARTS;

  if (typeof registerView === 'function') {
    registerView('stel_casino', rCasinoDashboard);
  }

})(window);
