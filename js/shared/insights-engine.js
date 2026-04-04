// GF — Insights Engine: Auto-generated alerts for all ERP modules
(function(window) {
  'use strict';

  /**
   * Generate operational insights/alerts for any module
   * @param {string} module — 'salem'|'endless'|'dynamo'|'wirebit'|'stellaris'
   * @param {object} data — module-specific data object
   * @returns {Array<{type: string, icon: string, text: string}>}
   */
  function generateInsights(module, data) {
    if (!data) return [];
    const ins = [];
    const f = typeof fmt === 'function' ? fmt : function(v) { return '$' + Math.round(Math.abs(v)).toLocaleString('es-MX'); };

    switch (module) {

      // ═══════════════════════════════════════
      // SALEM (TPV)
      // ═══════════════════════════════════════
      case 'salem': {
        const d = data; // expects { ingresos, comisiones, pct_comision, terminales_activas, terminales_total, transacciones, prev_transacciones }
        if (d.pct_comision > 5) {
          ins.push({ type: 'warn', icon: '⚠️', text: 'Comisiones TPV (' + d.pct_comision.toFixed(1) + '%) superan el 5% de los ingresos. Revisar tarifas con procesador.' });
        }
        if (d.terminales_total > 0 && d.terminales_activas < d.terminales_total * 0.8) {
          const inactivas = d.terminales_total - d.terminales_activas;
          ins.push({ type: 'alert', icon: '🔴', text: inactivas + ' terminales inactivas de ' + d.terminales_total + ' totales. Verificar estado y conectividad.' });
        }
        if (d.prev_transacciones > 0 && d.transacciones > 0) {
          const pct = ((d.transacciones - d.prev_transacciones) / d.prev_transacciones * 100).toFixed(1);
          const dir = pct > 0 ? '▲' : '▼';
          ins.push({ type: pct > 0 ? 'positive' : 'warn', icon: dir, text: 'Transacciones ' + dir + ' ' + Math.abs(pct) + '% vs periodo anterior.' });
        }
        break;
      }

      // ═══════════════════════════════════════
      // ENDLESS / DYNAMO (Créditos)
      // ═══════════════════════════════════════
      case 'endless':
      case 'dynamo': {
        const d = data; // expects { cartera_total, cartera_vencida, pct_vencida, cobranza_mes, cobranza_prev, morosidad }
        if (d.pct_vencida > 10) {
          ins.push({ type: 'alert', icon: '🔴', text: 'Cartera vencida (' + d.pct_vencida.toFixed(1) + '%) supera el 10%. Total vencido: ' + f(d.cartera_vencida) + '.' });
        } else if (d.pct_vencida > 5) {
          ins.push({ type: 'warn', icon: '⚠️', text: 'Cartera vencida en ' + d.pct_vencida.toFixed(1) + '%. Monitorear cobranza.' });
        }
        if (d.cobranza_prev > 0 && d.cobranza_mes > 0) {
          const pct = ((d.cobranza_mes - d.cobranza_prev) / d.cobranza_prev * 100).toFixed(1);
          if (pct < -10) {
            ins.push({ type: 'alert', icon: '▼', text: 'Cobranza cayo ' + Math.abs(pct) + '% vs mes anterior (' + f(d.cobranza_prev) + ' → ' + f(d.cobranza_mes) + ').' });
          }
        }
        if (d.morosidad > 15) {
          ins.push({ type: 'alert', icon: '🔴', text: 'Indice de morosidad en ' + d.morosidad.toFixed(1) + '% — nivel critico.' });
        }
        break;
      }

      // ═══════════════════════════════════════
      // WIREBIT (Crypto)
      // ═══════════════════════════════════════
      case 'wirebit': {
        const d = data; // expects { margen_pct, volumen, volumen_prev, ingresos, costos }
        if (d.margen_pct < 2) {
          ins.push({ type: 'alert', icon: '🔴', text: 'Margen operativo (' + d.margen_pct.toFixed(1) + '%) por debajo del 2%. Revisar spreads y costos.' });
        } else if (d.margen_pct < 5) {
          ins.push({ type: 'warn', icon: '⚠️', text: 'Margen operativo en ' + d.margen_pct.toFixed(1) + '%. Monitorear.' });
        }
        if (d.volumen_prev > 0 && d.volumen > 0) {
          const pct = ((d.volumen - d.volumen_prev) / d.volumen_prev * 100).toFixed(1);
          const dir = pct > 0 ? '▲' : '▼';
          ins.push({ type: pct > 0 ? 'positive' : 'warn', icon: dir, text: 'Volumen de operaciones ' + dir + ' ' + Math.abs(pct) + '% vs periodo anterior.' });
        }
        break;
      }

      // ═══════════════════════════════════════
      // STELLARIS (P&L General)
      // ═══════════════════════════════════════
      case 'stellaris': {
        const d = data; // expects { ingresos, gastos, resultado, prev_resultado }
        if (d.gastos > d.ingresos && d.ingresos > 0) {
          ins.push({ type: 'alert', icon: '🔴', text: 'Gastos (' + f(d.gastos) + ') superan ingresos (' + f(d.ingresos) + '). Resultado negativo.' });
        }
        if (d.prev_resultado && d.resultado) {
          const pct = ((d.resultado - d.prev_resultado) / Math.abs(d.prev_resultado) * 100).toFixed(1);
          const dir = pct > 0 ? '▲' : '▼';
          ins.push({ type: pct > 0 ? 'positive' : 'warn', icon: dir, text: 'Resultado ' + dir + ' ' + Math.abs(pct) + '% vs periodo anterior.' });
        }
        break;
      }
    }

    return ins;
  }

  /**
   * Render insights panel HTML
   * @param {Array} insights — from generateInsights()
   * @returns {string} HTML string
   */
  function renderInsightsHTML(insights) {
    if (!insights || !insights.length) return '';
    return '<div style="margin-bottom:14px;display:flex;flex-direction:column;gap:4px">' +
      insights.map(function(i) {
        var bg = i.type === 'alert' ? 'var(--red-bg)' : i.type === 'warn' ? 'var(--orange-bg)' : i.type === 'positive' ? 'var(--green-bg)' : 'var(--blue-bg)';
        var tc = i.type === 'alert' ? 'var(--red)' : i.type === 'warn' ? 'var(--orange)' : i.type === 'positive' ? 'var(--green)' : 'var(--blue)';
        return '<div style="background:' + bg + ';color:' + tc + ';border-radius:var(--r);padding:6px 12px;font-size:.7rem;line-height:1.4">' +
          i.icon + ' ' + (typeof escapeHtml === 'function' ? escapeHtml(i.text) : i.text) + '</div>';
      }).join('') + '</div>';
  }

  // ═══════════════════════════════════════
  // EXPOSE
  // ═══════════════════════════════════════
  window.generateInsights = generateInsights;
  window.renderInsightsHTML = renderInsightsHTML;

})(window);
