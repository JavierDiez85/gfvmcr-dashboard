// GF — Stellaris Casino: Dashboard
(function(window) {
  'use strict';

  const CASINO_CHARTS = {};

  let _casinoFilter = 'ultimo'; // active filter — default to last corte

  function _casinoDateRange(filter) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const fmt2 = d => d.toISOString().slice(0,10);
    const to = fmt2(today);

    switch(filter) {
      case 'ultimo': {
        // Last corte = most recent day with data (typically yesterday's close)
        const data = casinoLoad();
        const cortes = data.cortes || [];
        if (cortes.length) {
          const lastFecha = cortes[0].fecha;
          return { from: lastFecha, to: lastFecha, label: 'Último corte (' + lastFecha + ')' };
        }
        return { from: to, to, label: 'Último corte (sin datos)' };
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

  // Badge helper for day-over-day comparison (reuses cmpDelta from compare-engine)
  function _casinoBadge(cur, prev, invert) {
    if (prev === null || prev === undefined || typeof cmpDelta !== 'function') return '';
    const d = cmpDelta(cur, prev);
    if (d.dir === 'neutral') return '';
    const cls = invert ? (d.dir === 'up' ? 'ddn' : 'dup') : (d.dir === 'up' ? 'dup' : 'ddn');
    const arrow = d.dir === 'up' ? '&#9650;' : '&#9660;';
    return ' <span class="' + cls + '" style="font-size:.55rem;padding:0 4px;border-radius:8px;white-space:nowrap">' + arrow + ' ' + d.label + '</span>';
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

    // Previous period for comparison badges
    const prevCorte = (_casinoFilter === 'ultimo' && last.fecha) ? casinoPrevCorte(last.fecha) : null;
    const prevKpis = prevCorte ? casinoKPIs(prevCorte.fecha, prevCorte.fecha) : (_casinoFilter !== 'ultimo' ? casinoPrevKPIs(range.from, range.to) : null);
    const B = (cur, prev, inv) => prevKpis ? _casinoBadge(cur, prev, inv) : '';

    // Analytics
    const insights = (typeof casinoInsights === 'function') ? casinoInsights(kpis, prevKpis) : [];
    const breakeven = (typeof casinoBreakEven === 'function') ? casinoBreakEven(kpis) : {};
    const provStats = (cortes.length > 1 && typeof casinoProviderStats === 'function') ? casinoProviderStats(cortes) : null;

    // Filter bar
    const filters = [
      {id:'ultimo',label:'Último Corte'},{id:'semana',label:'Semana'},
      {id:'mes',label:'Mes'},{id:'trimestre',label:'Trimestre'},{id:'semestre',label:'Semestre'},
      {id:'anual',label:'Año'}
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
        <div style="display:flex;gap:3px;flex-wrap:wrap;align-items:center">
          ${filterBar}
          <button class="pbtn casino-download-btn" style="font-size:.68rem;padding:3px 10px;background:var(--blue);color:white;border-color:var(--blue);margin-left:4px" title="Descargar informe PDF">📄 PDF</button>
        </div>
      </div>

      <!-- KPIs with comparison badges -->
      <div class="kpi-row" style="margin-bottom:14px">
        <div class="kpi-card" style="--ac:var(--green)">
          <div class="kpi-top"><div class="kpi-lbl">Netwin Total</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">💰</div></div>
          <div class="kpi-val" style="color:var(--green)">${fmt(kpis.total_netwin || 0)}</div>
          <div class="kpi-d dup">Ganancia neta${B(kpis.total_netwin, prevKpis?.total_netwin, false)}</div>
        </div>
        <div class="kpi-card" style="--ac:${(kpis.total_resultado||0) >= 0 ? 'var(--green)' : '#e53935'}">
          <div class="kpi-top"><div class="kpi-lbl">Resultado Caja</div><div class="kpi-ico" style="background:var(--red-bg);color:#e53935">🏦</div></div>
          <div class="kpi-val" style="color:${(kpis.total_resultado||0) >= 0 ? 'var(--green)' : '#e53935'}">${fmt(kpis.total_resultado || 0)}</div>
          <div class="kpi-d dnu">Entradas - Salidas${B(kpis.total_resultado, prevKpis?.total_resultado, false)}</div>
        </div>
        <div class="kpi-card" style="--ac:var(--blue)">
          <div class="kpi-top"><div class="kpi-lbl">Hold Promedio</div><div class="kpi-ico" style="background:var(--blue-bg);color:var(--blue)">📊</div></div>
          <div class="kpi-val" style="color:var(--blue)">${kpis.avg_hold ? kpis.avg_hold.toFixed(2) + '%' : '—'}</div>
          <div class="kpi-d dnu">% retencion${B(kpis.avg_hold, prevKpis?.avg_hold, false)}</div>
        </div>
        <div class="kpi-card" style="--ac:var(--purple)">
          <div class="kpi-top"><div class="kpi-lbl">Jugado Total</div><div class="kpi-ico" style="background:var(--purple-bg);color:var(--purple)">🎰</div></div>
          <div class="kpi-val" style="color:var(--purple)">${fmt(kpis.total_jugado || 0)}</div>
          <div class="kpi-d dnu">${kpis.total_terminales || 0} terminales${B(kpis.total_jugado, prevKpis?.total_jugado, false)}</div>
        </div>
      </div>

      <!-- Second row KPIs -->
      <div class="kpi-row c3" style="margin-bottom:14px">
        <div class="kpi-card" style="--ac:var(--orange)">
          <div class="kpi-top"><div class="kpi-lbl">Ocupacion</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">👥</div></div>
          <div class="kpi-val" style="color:var(--orange)">${kpis.avg_ocupacion ? kpis.avg_ocupacion.toFixed(1) + '%' : '—'}</div>
          <div class="kpi-d dnu">${kpis.total_aforo || 0} personas${B(kpis.avg_ocupacion, prevKpis?.avg_ocupacion, false)}</div>
        </div>
        <div class="kpi-card" style="--ac:var(--green)">
          <div class="kpi-top"><div class="kpi-lbl">Cuentas Nuevas</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">📈</div></div>
          <div class="kpi-val" style="color:var(--green)">${kpis.total_altas || 0}</div>
          <div class="kpi-d dup">Altas${B(kpis.total_altas, prevKpis?.total_altas, false)}</div>
        </div>
        <div class="kpi-card" style="--ac:var(--muted)">
          <div class="kpi-top"><div class="kpi-lbl">Cortes</div><div class="kpi-ico" style="background:var(--bg);color:var(--muted)">📋</div></div>
          <div class="kpi-val">${kpis.num_cortes || 0}</div>
          <div class="kpi-d dnu">reportes cargados</div>
        </div>
      </div>

      <!-- Explicacion general -->
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--r);padding:10px 14px;margin-bottom:14px;font-size:.7rem;color:var(--text);line-height:1.5">
        <b>Resumen del periodo:</b> El casino recibio ${fmt(kpis.total_entradas || 0)} en entradas y pago ${fmt(kpis.total_salidas || 0)} en salidas.
        Las maquinas generaron ${fmt(kpis.total_netwin || 0)} de netwin (${kpis.avg_hold ? kpis.avg_hold.toFixed(2)+'%' : '—'} hold).
        ${(kpis.total_resultado || 0) < 0 && (kpis.total_promo_redimible || 0) > 0
          ? 'El resultado de caja es negativo (' + fmt(kpis.total_resultado) + ') porque se entregaron ' + fmt(kpis.total_promo_redimible) + ' en promociones redimibles (sorteos) que se pagaron como premios reales. Sin estas promociones, el resultado hubiera sido ' + fmt(kpis.resultado_sin_promos || 0) + '.'
          : 'El resultado de caja es ' + fmt(kpis.total_resultado || 0) + '.'}
      </div>

      <!-- Alertas/Insights -->
      ${insights.length ? `
        <div style="margin-bottom:14px;display:flex;flex-direction:column;gap:4px">
          ${insights.map(i => {
            const bg = i.type === 'alert' ? 'var(--red-bg)' : i.type === 'warn' ? 'var(--orange-bg)' : i.type === 'positive' ? 'var(--green-bg)' : 'var(--blue-bg)';
            const tc = i.type === 'alert' ? 'var(--red)' : i.type === 'warn' ? 'var(--orange)' : i.type === 'positive' ? 'var(--green)' : 'var(--blue)';
            return '<div style="background:' + bg + ';color:' + tc + ';border-radius:var(--r);padding:6px 12px;font-size:.7rem;line-height:1.4">' + i.icon + ' ' + escapeHtml(i.text) + '</div>';
          }).join('')}
        </div>
      ` : ''}

      <!-- Flujo de Dinero -->
      <div class="tw" style="margin-bottom:14px">
        <div class="tw-h"><div class="tw-ht">💸 Flujo de Dinero</div></div>
        <div style="overflow-x:auto">
          <table class="bt">
            <thead><tr><th colspan="3" style="text-align:left">ENTRADAS</th></tr></thead>
            <tbody>
              <tr><td>Deposito de Juego</td><td class="mo pos">${fmt(kpis.total_deposito_juego_in || 0)}</td><td style="font-size:.6rem;color:var(--muted);width:50px">${kpis.pct_deposito ? kpis.pct_deposito.toFixed(1)+'%' : ''}</td></tr>
              <tr><td>Acceso e Instalaciones</td><td class="mo pos">${fmt(kpis.total_acceso_instalaciones || 0)}</td><td style="font-size:.6rem;color:var(--muted)">${kpis.pct_acceso ? kpis.pct_acceso.toFixed(1)+'%' : ''}</td></tr>
              <tr><td>Tarjeta Bancaria</td><td class="mo pos">${fmt(kpis.total_tarjeta_bancaria || 0)}</td><td style="font-size:.6rem;color:var(--muted)">${kpis.pct_tarjeta ? kpis.pct_tarjeta.toFixed(1)+'%' : ''}</td></tr>
              <tr style="font-weight:700;border-top:2px solid var(--border2)"><td>= TOTAL ENTRADAS</td><td class="mo pos">${fmt(kpis.total_entradas || 0)}</td><td></td></tr>
            </tbody>
            <thead><tr><th colspan="3" style="text-align:left;padding-top:10px">SALIDAS</th></tr></thead>
            <tbody>
              <tr><td>Devolucion Depositos</td><td class="mo neg">${fmt(kpis.total_deposito_juego_out || 0)}</td><td></td></tr>
              <tr><td>Pago de Premios</td><td class="mo neg">${fmt(kpis.total_pago_premios || 0)}</td><td></td></tr>
              <tr style="font-weight:700;border-top:2px solid var(--border2)"><td>= TOTAL SALIDAS</td><td class="mo neg">${fmt(kpis.total_salidas || 0)}</td><td></td></tr>
            </tbody>
            <thead><tr><th colspan="3" style="text-align:left;padding-top:10px">IMPUESTOS <span style="font-weight:400;font-size:.6rem;color:var(--muted)">Art. 137-139 LISR + Chiapas</span></th></tr></thead>
            <tbody>
              <tr><td>Federal ISR (1%)</td><td class="mo">${fmt(kpis.total_imp_federal || 0)}</td><td></td></tr>
              <tr><td>Estatal Chiapas (6%)</td><td class="mo">${fmt(kpis.total_imp_estatal || 0)}</td><td></td></tr>
              <tr style="font-weight:700;border-top:2px solid var(--border2)"><td>= RETENCION (7%)</td><td class="mo">${fmt(kpis.total_retencion || 0)}</td><td></td></tr>
              <tr><td style="font-size:.6rem;color:var(--muted)">Base imponible (premios brutos)</td><td class="mo" style="font-size:.6rem;color:var(--muted)">${fmt(kpis.premios_brutos || 0)}</td><td></td></tr>
            </tbody>
            <tfoot>
              <tr style="font-weight:700;font-size:1.05em;border-top:3px solid var(--border2);background:var(--bg2)">
                <td>RESULTADO</td>
                <td class="mo ${(kpis.total_resultado || 0) >= 0 ? 'pos' : 'neg'}">${fmt(kpis.total_resultado || 0)}</td>
                <td></td>
              </tr>
              <tr><td colspan="3" style="font-size:.58rem;color:var(--muted);padding:4px 8px">Formula: Entradas - Salidas - Retencion = Resultado</td></tr>
            </tfoot>
          </table>
        </div>
        <div style="font-size:.65rem;color:var(--muted);padding:8px 10px;line-height:1.5;border-top:1px solid var(--border)">
          <b>¿Como entra el dinero?</b> Los clientes pagan Deposito de Juego para jugar y Acceso e Instalaciones como cover.
          <b>¿Como sale?</b> Se devuelven depositos y se pagan premios a ganadores.
          <b>Impuestos:</b> Se retiene 7% sobre premios brutos (1% federal ISR Art. 137-139 LISR + 6% estatal Chiapas, max permitido antes de que la tasa federal suba a 21%).
        </div>
      </div>

      <!-- Impuestos KPIs -->
      <div class="kpi-row c3" style="margin-bottom:14px">
        <div class="kpi-card" style="--ac:var(--blue)">
          <div class="kpi-top"><div class="kpi-lbl">Impuesto Federal</div><div class="kpi-ico" style="background:var(--blue-bg);color:var(--blue)">🏛️</div></div>
          <div class="kpi-val" style="color:var(--blue)">${fmt(kpis.total_imp_federal || 0)}</div>
          <div class="kpi-d dnu">1% ISR · Art. 137-139 LISR</div>
        </div>
        <div class="kpi-card" style="--ac:var(--orange)">
          <div class="kpi-top"><div class="kpi-lbl">Impuesto Estatal</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">🏢</div></div>
          <div class="kpi-val" style="color:var(--orange)">${fmt(kpis.total_imp_estatal || 0)}</div>
          <div class="kpi-d dnu">6% Chiapas (max antes de 21% fed)</div>
        </div>
        <div class="kpi-card" style="--ac:#e53935">
          <div class="kpi-top"><div class="kpi-lbl">Retencion Total</div><div class="kpi-ico" style="background:var(--red-bg);color:#e53935">💲</div></div>
          <div class="kpi-val" style="color:#e53935">${fmt(kpis.total_retencion || 0)}</div>
          <div class="kpi-d dnu">7% s/ ${fmt(kpis.premios_brutos || 0)} premios brutos</div>
        </div>
      </div>

      <!-- Premios y Promociones -->
      <div class="tw" style="margin-bottom:14px">
        <div class="tw-h"><div class="tw-ht">🎁 Premios y Promociones</div></div>
        <div style="overflow-x:auto">
          <table class="bt">
            <thead><tr><th colspan="2" style="text-align:left">PREMIOS</th></tr></thead>
            <tbody>
              <tr><td>Premios Maquinas</td><td class="mo">${fmt(kpis.total_premios_maquinas || 0)}</td></tr>
              <tr><td>Premios Sorteo</td><td class="mo">${fmt(kpis.total_premio_sorteo || 0)}</td></tr>
              <tr style="font-weight:700;border-top:2px solid var(--border2)"><td>Premios Brutos (base imponible)</td><td class="mo">${fmt(kpis.premios_brutos || 0)}</td></tr>
            </tbody>
            <thead><tr><th colspan="2" style="text-align:left;padding-top:10px">PROMOCIONES</th></tr></thead>
            <tbody>
              <tr><td>Redimibles (sorteos cobrables)</td><td class="mo">${fmt(kpis.total_promo_redimible || 0)}</td></tr>
              <tr><td>No Redimibles (solo jugar)</td><td class="mo">${fmt(kpis.total_promo_no_redimible || 0)}</td></tr>
              <tr><td>Cancelaciones NR</td><td class="mo neg">${fmt(-(kpis.total_cancel_promo_nr || 0))}</td></tr>
              <tr style="font-weight:700;border-top:2px solid var(--border2)"><td>= Neto Promociones</td><td class="mo">${fmt(kpis.neto_promociones || 0)}</td></tr>
            </tbody>
          </table>
        </div>
        <div style="font-size:.65rem;color:var(--muted);padding:8px 10px;line-height:1.5;border-top:1px solid var(--border)">
          <b>¿Que son las promociones?</b> El casino regala fichas a traves de sorteos. Las <b>redimibles</b> se pueden cobrar como efectivo
          (por eso Promo Redimible = Premio Sorteo: ${fmt(kpis.total_promo_redimible || 0)}). Las <b>no redimibles</b> solo sirven para jugar y no se cobran.
          Las cancelaciones son fichas no redimibles que no se usaron.
        </div>
      </div>

      <!-- Break-Even de Promociones -->
      ${(kpis.total_promo_redimible || 0) > 0 ? `
        <div class="kpi-row c3" style="margin-bottom:14px">
          <div class="kpi-card" style="--ac:${breakeven.status === 'profit' ? 'var(--green)' : 'var(--red)'}">
            <div class="kpi-top"><div class="kpi-lbl">Ratio Netwin/Promo</div><div class="kpi-ico" style="background:${breakeven.status === 'profit' ? 'var(--green-bg)' : 'var(--red-bg)'};color:${breakeven.status === 'profit' ? 'var(--green)' : 'var(--red)'}">⚖️</div></div>
            <div class="kpi-val" style="color:${breakeven.status === 'profit' ? 'var(--green)' : 'var(--red)'}">${breakeven.ratio}x</div>
            <div class="kpi-d ${breakeven.status === 'profit' ? 'dup' : 'ddn'}">${breakeven.ratio >= 1 ? 'Netwin cubre promos' : 'Promos superan netwin'}</div>
          </div>
          <div class="kpi-card" style="--ac:var(--purple)">
            <div class="kpi-top"><div class="kpi-lbl">Break-Even Netwin</div><div class="kpi-ico" style="background:var(--purple-bg);color:var(--purple)">🎯</div></div>
            <div class="kpi-val" style="color:var(--purple)">${fmt(breakeven.breakeven)}</div>
            <div class="kpi-d dnu">Netwin necesario para cubrir promos</div>
          </div>
          <div class="kpi-card" style="--ac:var(--orange)">
            <div class="kpi-top"><div class="kpi-lbl">Costo Promo/Terminal</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">🎰</div></div>
            <div class="kpi-val" style="color:var(--orange)">${fmt(breakeven.costo_terminal)}</div>
            <div class="kpi-d dnu">Costo promocional por maquina</div>
          </div>
        </div>
      ` : ''}

      <!-- Analisis de Rentabilidad -->
      <div class="tw" style="margin-bottom:14px">
        <div class="tw-h"><div class="tw-ht">📈 Analisis de Rentabilidad</div></div>
        <div style="overflow-x:auto">
          <table class="bt">
            <thead><tr><th colspan="2" style="text-align:left">RENTABILIDAD DE MAQUINAS</th></tr></thead>
            <tbody>
              <tr>
                <td class="bld">Ganancia Bruta (Netwin)</td>
                <td class="mo pos bld">${fmt(kpis.total_netwin || 0)}</td>
              </tr>
              <tr><td style="font-size:.6rem;color:var(--muted);padding-left:16px">Hold ${kpis.avg_hold ? kpis.avg_hold.toFixed(2)+'%' : '—'} · ${kpis.total_terminales || 0} terminales · ${fmt(kpis.netwin_por_terminal || 0)}/terminal</td><td></td></tr>
              <tr>
                <td class="bld">Costo Promociones Redimibles</td>
                <td class="mo neg bld">${fmt(-(kpis.total_promo_redimible || 0))}</td>
              </tr>
              <tr style="font-weight:700;border-top:2px solid var(--border2);background:var(--bg2)">
                <td>= Ganancia Neta Real</td>
                <td class="mo ${(kpis.ganancia_neta_real || 0) >= 0 ? 'pos' : 'neg'} bld">${fmt(kpis.ganancia_neta_real || 0)}</td>
              </tr>
            </tbody>
            <thead><tr><th colspan="2" style="text-align:left;padding-top:10px">RESULTADO DE CAJA <span style="font-weight:400;font-size:.6rem;color:var(--muted)">(formula distinta)</span></th></tr></thead>
            <tbody>
              <tr>
                <td>Entradas</td>
                <td class="mo pos">${fmt(kpis.total_entradas || 0)}</td>
              </tr>
              <tr>
                <td>Salidas</td>
                <td class="mo neg">${fmt(-(kpis.total_salidas || 0))}</td>
              </tr>
              <tr>
                <td>Retencion Impuestos (7%)</td>
                <td class="mo neg">${fmt(-(kpis.total_retencion || 0))}</td>
              </tr>
              <tr style="font-weight:700;border-top:3px solid var(--border2);background:var(--bg2);font-size:1.05em">
                <td>= Resultado de Caja</td>
                <td class="mo ${(kpis.total_resultado || 0) >= 0 ? 'pos' : 'neg'} bld">${fmt(kpis.total_resultado || 0)}</td>
              </tr>
              <tr style="border-top:2px dashed var(--border2)">
                <td style="color:var(--muted);font-size:.72rem">Sin promociones seria</td>
                <td class="mo pos" style="font-size:.72rem">${fmt(kpis.resultado_sin_promos || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="font-size:.65rem;color:var(--muted);padding:8px 10px;line-height:1.5;border-top:1px solid var(--border)">
          <b>¿Por que hay dos resultados?</b> Son metricas distintas.
          La <b>Ganancia Neta Real</b> (${fmt(kpis.ganancia_neta_real || 0)}) mide cuanto gano el casino en maquinas despues de descontar lo que regalo en sorteos.
          El <b>Resultado de Caja</b> (${fmt(kpis.total_resultado || 0)}) es el flujo real de efectivo: Entradas - Salidas - Impuestos.
          ${(kpis.total_resultado || 0) < 0
            ? 'El resultado es negativo porque las promociones redimibles (sorteos cobrables) se pagan como premios reales, aumentando las salidas. Sin promociones, el resultado hubiera sido ' + fmt(kpis.resultado_sin_promos || 0) + '.'
            : ''}
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

      <!-- Trend Charts (only if >1 corte) -->
      ${cortes.length > 1 ? `
        <div style="margin-bottom:14px">
          <div style="font-family:'Poppins',sans-serif;font-size:.78rem;font-weight:700;margin-bottom:8px">📈 Evolucion Temporal (${cortes.length} dias)</div>
          <div class="g2" style="margin-bottom:10px">
            <div class="cc"><div class="cc-h"><div><div class="cc-t">Netwin Diario</div></div></div><div class="cc-b"><canvas id="c-casino-nw-evo" height="180"></canvas></div></div>
            <div class="cc"><div class="cc-h"><div><div class="cc-t">Resultado de Caja</div></div></div><div class="cc-b"><canvas id="c-casino-res-evo" height="180"></canvas></div></div>
          </div>
          <div class="g2">
            <div class="cc"><div class="cc-h"><div><div class="cc-t">Entradas Desglosadas</div></div></div><div class="cc-b"><canvas id="c-casino-ent-evo" height="180"></canvas></div></div>
            <div class="cc"><div class="cc-h"><div><div class="cc-t">Hold% Evolucion</div></div></div><div class="cc-b"><canvas id="c-casino-hold-evo" height="180"></canvas></div></div>
          </div>
        </div>
      ` : ''}

      <!-- Provider detail (sorted by netwin, with participation %) -->
      ${last.fecha ? `
        <div class="tw" style="margin-bottom:14px">
          <div class="tw-h"><div class="tw-ht">📊 ${provStats ? 'Proveedores — Acumulado (' + cortes.length + ' dias)' : 'Proveedores — ' + escapeHtml(last.fecha)}</div></div>
          <div style="overflow-x:auto">
            <table class="bt">
              <thead><tr>
                <th>Proveedor</th><th class="r">Jugado</th><th class="r">Netwin</th>
                <th class="r">Part.%</th><th class="r">Hold%</th><th class="r">Term.</th><th class="r">Netwin/T</th>${provStats ? '<th class="r">Netwin/Dia</th>' : ''}<th></th>
              </tr></thead>
              <tbody>
                ${(provStats || (last.proveedores||[]).sort((a,b) => b.netwin - a.netwin).map(p => ({...p, participacion: last.netwin ? +(p.netwin/last.netwin*100).toFixed(1) : 0}))).map(p => {
                  const sem = p.hold >= 10 ? '⭐' : p.hold >= 5 ? '✅' : p.hold >= 0 ? '⚠️' : '🔴';
                  const semLabel = p.hold >= 10 ? 'Excelente' : p.hold >= 5 ? 'Bueno' : p.hold >= 0 ? 'Hold bajo' : 'Perdida';
                  const hColor = p.hold >= 10 ? 'var(--green)' : p.hold >= 5 ? 'var(--blue)' : p.hold >= 0 ? 'var(--orange)' : 'var(--red)';
                  return '<tr>' +
                    '<td class="bld">' + sem + ' ' + escapeHtml(p.nombre) + '</td>' +
                    '<td class="mo">' + fmt(p.jugado) + '</td>' +
                    '<td class="mo ' + (p.netwin >= 0 ? 'pos' : 'neg') + ' bld">' + fmt(p.netwin) + '</td>' +
                    '<td class="mo" style="font-size:.65rem">' + (p.participacion || 0) + '%</td>' +
                    '<td class="mo" style="color:' + hColor + '">' + (typeof p.hold === 'number' ? p.hold.toFixed(2) : p.hold) + '%</td>' +
                    '<td class="mo">' + p.terminales + '</td>' +
                    '<td class="mo">' + fmt(p.netwin_terminal || (p.terminales ? Math.round(p.netwin/p.terminales) : 0)) + '</td>' +
                    (provStats ? '<td class="mo" style="font-size:.65rem">' + fmt(p.netwin_dia || 0) + '</td>' : '') +
                    '<td style="font-size:.55rem;color:var(--muted)">' + semLabel + '</td></tr>';
                }).join('')}
                <tr style="font-weight:700;border-top:2px solid var(--border2)">
                  <td>TOTAL</td>
                  <td class="mo">${fmt(provStats ? provStats.reduce((s,p)=>s+p.jugado,0) : last.jugado)}</td>
                  <td class="mo pos">${fmt(provStats ? provStats.reduce((s,p)=>s+p.netwin,0) : last.netwin)}</td>
                  <td class="mo">100%</td>
                  <td class="mo">${kpis.avg_hold ? kpis.avg_hold.toFixed(2)+'%' : last.hold_pct ? last.hold_pct.toFixed(2)+'%' : '—'}</td>
                  <td class="mo">${kpis.total_terminales || last.terminales || ''}</td>
                  <td class="mo">${fmt(kpis.netwin_por_terminal || last.netwin_terminal || 0)}</td>
                  ${provStats ? '<td></td>' : ''}<td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ` : '<div style="text-align:center;color:var(--muted);padding:40px">Sin datos. Sube el primer corte PDF en la seccion de Carga de Datos.</div>'}

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

    // Wire PDF download button
    const dlBtn = el.querySelector('.casino-download-btn');
    if (dlBtn) {
      dlBtn.addEventListener('click', function() {
        if (typeof casinoGenerateReport === 'function') casinoGenerateReport(_casinoFilter);
        else toast && toast('Modulo de reportes no cargado');
      });
    }

    // Render charts
    if (last.proveedores && last.proveedores.length) {
      setTimeout(() => _renderCasinoCharts(last), 80);
    }
    // Render trend charts (only if >1 corte)
    if (cortes.length > 1) {
      setTimeout(() => _renderCasinoTrendCharts(cortes), 120);
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
  // TREND CHARTS
  // ═══════════════════════════════════════
  function _renderCasinoTrendCharts(cortes) {
    const isDark = document.body.classList.contains('dark');
    const tc = isDark ? '#9da0c5' : '#8b8fb5';
    const gc = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
    const sorted = cortes.slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
    const labels = sorted.map(c => c.fecha.slice(5)); // MM-DD
    const mkOpts = (cbk) => ({
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: tc, font: { size: 9 } } },
        y: { grid: { color: gc }, ticks: { color: tc, font: { size: 8 }, callback: cbk || (v => '$' + Math.round(v).toLocaleString('es-MX')) } }
      }
    });

    // 1. Netwin line
    const nwC = document.getElementById('c-casino-nw-evo');
    if (nwC) {
      if (CASINO_CHARTS['nw_evo']) CASINO_CHARTS['nw_evo'].destroy();
      CASINO_CHARTS['nw_evo'] = new Chart(nwC, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Netwin', data: sorted.map(c => c.netwin || 0), borderColor: '#00b875', backgroundColor: '#00b87520', fill: true, tension: 0.3, pointRadius: 4, pointBackgroundColor: '#00b875', borderWidth: 2 }] },
        options: mkOpts()
      });
    }

    // 2. Resultado line
    const resC = document.getElementById('c-casino-res-evo');
    if (resC) {
      if (CASINO_CHARTS['res_evo']) CASINO_CHARTS['res_evo'].destroy();
      const resData = sorted.map(c => c.resultado_caja || 0);
      CASINO_CHARTS['res_evo'] = new Chart(resC, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Resultado', data: resData, borderColor: '#e53935', backgroundColor: '#e5393520', fill: true, tension: 0.3, pointRadius: 4, pointBackgroundColor: resData.map(v => v >= 0 ? '#00b875' : '#e53935'), borderWidth: 2, segment: { borderColor: ctx => (ctx.p0.parsed.y >= 0 && ctx.p1.parsed.y >= 0) ? '#00b875' : '#e53935' } }] },
        options: mkOpts()
      });
    }

    // 3. Entradas stacked bar
    const entC = document.getElementById('c-casino-ent-evo');
    if (entC) {
      if (CASINO_CHARTS['ent_evo']) CASINO_CHARTS['ent_evo'].destroy();
      CASINO_CHARTS['ent_evo'] = new Chart(entC, {
        type: 'bar',
        data: { labels, datasets: [
          { label: 'Deposito', data: sorted.map(c => c.deposito_juego_in || 0), backgroundColor: '#0073eaCC', borderRadius: 2 },
          { label: 'Acceso', data: sorted.map(c => c.acceso_instalaciones || 0), backgroundColor: '#00b875CC', borderRadius: 2 },
          { label: 'Tarjeta', data: sorted.map(c => c.tarjeta_bancaria_in || 0), backgroundColor: '#ff7043CC', borderRadius: 2 }
        ]},
        options: { ...mkOpts(), plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 9 }, boxWidth: 10, padding: 8, color: tc } } }, scales: { x: { stacked: true, grid: { display: false }, ticks: { color: tc, font: { size: 9 } } }, y: { stacked: true, grid: { color: gc }, ticks: { color: tc, font: { size: 8 }, callback: v => '$' + Math.round(v).toLocaleString('es-MX') } } } }
      });
    }

    // 4. Hold% line
    const holdC = document.getElementById('c-casino-hold-evo');
    if (holdC) {
      if (CASINO_CHARTS['hold_evo']) CASINO_CHARTS['hold_evo'].destroy();
      CASINO_CHARTS['hold_evo'] = new Chart(holdC, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Hold %', data: sorted.map(c => c.hold_pct || 0), borderColor: '#0073ea', backgroundColor: '#0073ea20', fill: true, tension: 0.3, pointRadius: 4, pointBackgroundColor: '#0073ea', borderWidth: 2 }] },
        options: mkOpts(v => v + '%')
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
