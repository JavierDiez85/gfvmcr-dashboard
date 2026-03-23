// GF — AI Tool definitions for Claude
'use strict';

const TOOLS = [
  {
    name: 'get_tpv_kpis',
    description: 'Obtener KPIs globales de Terminales Punto de Venta: total cobrado, comisiones (Efevoo, Salem, Convenia, Comisionista), número de clientes, transacciones y terminales. Filtrable por rango de fechas.',
    input_schema: {
      type: 'object',
      properties: {
        p_from: { type: 'string', description: 'Fecha inicio YYYY-MM-DD (opcional, sin filtro = histórico completo)' },
        p_to: { type: 'string', description: 'Fecha fin YYYY-MM-DD (opcional)' }
      }
    }
  },
  {
    name: 'get_tpv_clients_volume',
    description: 'Obtener volumen de cobro por cliente desglosado por tipo de tarjeta (TC, TD, Amex, TI). Incluye número de transacciones. Filtrable por período.',
    input_schema: {
      type: 'object',
      properties: {
        p_from: { type: 'string', description: 'Fecha inicio YYYY-MM-DD (opcional)' },
        p_to: { type: 'string', description: 'Fecha fin YYYY-MM-DD (opcional)' }
      }
    }
  },
  {
    name: 'get_tpv_commissions',
    description: 'Obtener comisiones netas por cliente: total cobrado, comisión de cada entidad (Efevoo, Salem, Convenia, Comisionista) y monto neto. Filtrable por período.',
    input_schema: {
      type: 'object',
      properties: {
        p_from: { type: 'string', description: 'Fecha inicio YYYY-MM-DD (opcional)' },
        p_to: { type: 'string', description: 'Fecha fin YYYY-MM-DD (opcional)' }
      }
    }
  },
  {
    name: 'get_tpv_agent_summary',
    description: 'Resumen de rendimiento por agente/promotor: total vendido, comisión Salem, comisión del agente, número de clientes, monto pagado y pendiente. Filtrable por período.',
    input_schema: {
      type: 'object',
      properties: {
        p_from: { type: 'string', description: 'Fecha inicio YYYY-MM-DD (opcional)' },
        p_to: { type: 'string', description: 'Fecha fin YYYY-MM-DD (opcional)' }
      }
    }
  },
  {
    name: 'get_tpv_terminal_status',
    description: 'Estado de terminales activas: cliente, terminal_id, último uso, ingresos, número de transacciones, días sin uso. Filtrable por período.',
    input_schema: {
      type: 'object',
      properties: {
        p_from: { type: 'string', description: 'Fecha inicio YYYY-MM-DD (opcional)' },
        p_to: { type: 'string', description: 'Fecha fin YYYY-MM-DD (opcional)' }
      }
    }
  },
  {
    name: 'get_tarjetas_kpis',
    description: 'KPIs del módulo de tarjetas: total transacciones, monto total, cargos vs abonos, tarjetas activas, saldo total, rechazadas, tasa de rechazo, ticket promedio.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'get_credit_portfolio',
    description: 'Obtener portafolio de créditos de una empresa. Incluye cada crédito con su tabla de amortización, pagos recibidos, saldo, interés generado, estado de morosidad.',
    input_schema: {
      type: 'object',
      properties: {
        company: { type: 'string', enum: ['endless', 'dynamo'], description: 'Empresa de créditos: "endless" o "dynamo"' }
      },
      required: ['company']
    }
  },
  {
    name: 'get_pl_summary',
    description: 'Obtener Estado de Resultados (P&L) de todas las entidades del grupo. Incluye ingresos, gastos, utilidad por mes y entidad.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'get_treasury_and_banks',
    description: 'Obtener movimientos de tesorería y saldos bancarios de todas las cuentas.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'get_tickets',
    description: 'Obtener tickets de pago del sistema TPV: montos, estados (abierto, aprobado, pagado, rechazado), fechas y destinos (banco o tarjeta).',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'get_cash_flows',
    description: 'Obtener flujos de efectivo: ingresos (gf_fi) y egresos (gf_fg) con categorías, montos y fechas.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'get_users',
    description: 'Obtener lista de usuarios del sistema: nombres, roles y estado activo.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'analyze_credit_risk',
    description: 'Análisis de riesgo crediticio del portafolio: concentración por cliente, índice de morosidad, reservas sugeridas, distribución de calificación de riesgo (A/B/C/D/E), exposición máxima por cliente.',
    input_schema: {
      type: 'object',
      properties: {
        company: { type: 'string', enum: ['endless', 'dynamo', 'both'], description: 'Empresa o ambas (default: both)' }
      }
    }
  },
  {
    name: 'project_cash_flow',
    description: 'Proyección de flujo de efectivo: estima ingresos futuros por comisiones TPV + intereses de créditos + flujos recurrentes para los próximos N meses.',
    input_schema: {
      type: 'object',
      properties: {
        months: { type: 'number', description: 'Meses a proyectar (default: 3, max: 12)' }
      }
    }
  },
  {
    name: 'compare_periods',
    description: 'Comparativo entre dos períodos: compara KPIs de TPV, créditos y tarjetas entre período actual vs anterior. Muestra variaciones absolutas y porcentuales.',
    input_schema: {
      type: 'object',
      properties: {
        period_type: { type: 'string', enum: ['month', 'quarter', 'year'], description: 'Tipo de período a comparar (default: month)' }
      }
    }
  },
  {
    name: 'get_alerts',
    description: 'Alertas proactivas del sistema: créditos próximos a vencer, terminales inactivas, pagos pendientes, concentración de riesgo, anomalías en flujo.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'simulate_credit',
    description: 'Simular un nuevo crédito: calcula tabla de amortización, pago mensual, total de intereses, CAT estimado y ROI para el grupo.',
    input_schema: {
      type: 'object',
      properties: {
        monto:  { type: 'number', description: 'Monto del crédito en MXN' },
        tasa:   { type: 'number', description: 'Tasa de interés anual (%)' },
        plazo:  { type: 'number', description: 'Plazo en meses' },
        comision: { type: 'number', description: 'Comisión de apertura % (default: 0)' }
      },
      required: ['monto', 'tasa', 'plazo']
    }
  },
  {
    name: 'search_client',
    description: 'Buscar un cliente por nombre en todas las entidades del grupo (TPV, créditos Endless, créditos Dynamo, tarjetas). Devuelve toda la información encontrada del cliente.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nombre o parte del nombre del cliente a buscar' }
      },
      required: ['query']
    }
  },
  {
    name: 'executive_summary',
    description: 'Resumen ejecutivo completo del Grupo Financiero VMCR: consolida KPIs de todas las entidades (TPV, créditos, tarjetas, tesorería, P&L) en un solo reporte.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'analyze_trends',
    description: 'Análisis de tendencias: identifica patrones en datos históricos de TPV (cobros mensuales, crecimiento de clientes), créditos (colocación, morosidad) y flujos de efectivo.',
    input_schema: {
      type: 'object',
      properties: {
        area: { type: 'string', enum: ['tpv', 'credits', 'treasury', 'all'], description: 'Área a analizar (default: all)' }
      }
    }
  }
];

module.exports = { TOOLS };
