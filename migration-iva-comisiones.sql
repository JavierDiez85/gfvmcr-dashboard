-- ══════════════════════════════════════════════════════════
-- Migración: Aplicar IVA (factor_iva) a TODAS las comisiones
-- El campo tpv_clients.factor_iva ya existe (default 1.16)
-- pero no se usaba en ningún cálculo. Esta migración lo aplica.
--
-- Patrón: monto × rate × COALESCE(c.factor_iva, 1.16)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════


-- ┌──────────────────────────────────────┐
-- │  1. tpv_commission_mix              │
-- │  4 cambios (1 por entidad)         │
-- └──────────────────────────────────────┘
CREATE OR REPLACE FUNCTION tpv_commission_mix(
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL
) RETURNS TABLE(
  entity TEXT,
  total_commission NUMERIC,
  total_cobrado NUMERIC
) LANGUAGE sql STABLE AS $$
  WITH base AS (
    SELECT t.monto, t.card_type_key, t.plazo_msi, t.cliente_id
    FROM tpv_transactions t
    WHERE (p_from IS NULL OR t.fecha >= p_from)
      AND (p_to IS NULL OR t.fecha <= p_to)
      AND t.cliente_id IS NOT NULL
  )
  -- Efevoo
  SELECT 'Efevoo'::TEXT AS entity,
    COALESCE(SUM(b.monto * CASE b.card_type_key
      WHEN 'TC' THEN c.rate_efevoo_tc WHEN 'TD' THEN c.rate_efevoo_td
      WHEN 'Amex' THEN c.rate_efevoo_amex WHEN 'TI' THEN c.rate_efevoo_ti ELSE 0 END
      * COALESCE(c.factor_iva, 1.16)), 0),
    COALESCE(SUM(b.monto), 0)
  FROM base b JOIN tpv_clients c ON c.id = b.cliente_id
  WHERE b.plazo_msi = 0
  UNION ALL
  -- Salem
  SELECT 'Salem'::TEXT,
    COALESCE(SUM(b.monto * CASE b.card_type_key
      WHEN 'TC' THEN c.rate_salem_tc WHEN 'TD' THEN c.rate_salem_td
      WHEN 'Amex' THEN c.rate_salem_amex WHEN 'TI' THEN c.rate_salem_ti ELSE 0 END
      * COALESCE(c.factor_iva, 1.16)), 0),
    COALESCE(SUM(b.monto), 0)
  FROM base b JOIN tpv_clients c ON c.id = b.cliente_id
  WHERE b.plazo_msi = 0
  UNION ALL
  -- Convenia
  SELECT 'Convenia'::TEXT,
    COALESCE(SUM(b.monto * CASE b.card_type_key
      WHEN 'TC' THEN c.rate_convenia_tc WHEN 'TD' THEN c.rate_convenia_td
      WHEN 'Amex' THEN c.rate_convenia_amex WHEN 'TI' THEN c.rate_convenia_ti ELSE 0 END
      * COALESCE(c.factor_iva, 1.16)), 0),
    COALESCE(SUM(b.monto), 0)
  FROM base b JOIN tpv_clients c ON c.id = b.cliente_id
  WHERE b.plazo_msi = 0
  UNION ALL
  -- Comisionista
  SELECT 'Comisionista'::TEXT,
    COALESCE(SUM(b.monto * CASE b.card_type_key
      WHEN 'TC' THEN c.rate_comisionista_tc WHEN 'TD' THEN c.rate_comisionista_td
      WHEN 'Amex' THEN c.rate_comisionista_amex WHEN 'TI' THEN c.rate_comisionista_ti ELSE 0 END
      * COALESCE(c.factor_iva, 1.16)), 0),
    COALESCE(SUM(b.monto), 0)
  FROM base b JOIN tpv_clients c ON c.id = b.cliente_id
  WHERE b.plazo_msi = 0;
$$;


-- ┌──────────────────────────────────────┐
-- │  2. tpv_client_commissions          │
-- │  5 cambios (4 entidades + neto)    │
-- └──────────────────────────────────────┘
CREATE OR REPLACE FUNCTION tpv_client_commissions(
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL
) RETURNS TABLE(
  client_id INT,
  cliente TEXT,
  total_cobrado NUMERIC,
  com_efevoo NUMERIC,
  com_salem NUMERIC,
  com_convenia NUMERIC,
  com_comisionista NUMERIC,
  monto_neto NUMERIC
) LANGUAGE sql STABLE AS $$
  SELECT
    c.id AS client_id,
    COALESCE(c.nombre_display, c.nombre) AS cliente,
    COALESCE(SUM(t.monto), 0) AS total_cobrado,
    -- Efevoo commission + IVA
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_efevoo_tc WHEN 'TD' THEN c.rate_efevoo_td
          WHEN 'Amex' THEN c.rate_efevoo_amex WHEN 'TI' THEN c.rate_efevoo_ti ELSE 0 END
      ELSE COALESCE((SELECT r.rate FROM tpv_client_msi_rates r
            WHERE r.cliente_id = c.id AND r.plazo = t.plazo_msi
            AND r.entity = 'efevoo' AND r.card_type = t.card_type_key), 0)
    END * COALESCE(c.factor_iva, 1.16)), 0) AS com_efevoo,
    -- Salem commission + IVA
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_salem_tc WHEN 'TD' THEN c.rate_salem_td
          WHEN 'Amex' THEN c.rate_salem_amex WHEN 'TI' THEN c.rate_salem_ti ELSE 0 END
      ELSE COALESCE((SELECT r.rate FROM tpv_client_msi_rates r
            WHERE r.cliente_id = c.id AND r.plazo = t.plazo_msi
            AND r.entity = 'salem' AND r.card_type = t.card_type_key), 0)
    END * COALESCE(c.factor_iva, 1.16)), 0) AS com_salem,
    -- Convenia commission + IVA
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_convenia_tc WHEN 'TD' THEN c.rate_convenia_td
          WHEN 'Amex' THEN c.rate_convenia_amex WHEN 'TI' THEN c.rate_convenia_ti ELSE 0 END
      ELSE COALESCE((SELECT r.rate FROM tpv_client_msi_rates r
            WHERE r.cliente_id = c.id AND r.plazo = t.plazo_msi
            AND r.entity = 'convenia' AND r.card_type = t.card_type_key), 0)
    END * COALESCE(c.factor_iva, 1.16)), 0) AS com_convenia,
    -- Comisionista commission + IVA
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_comisionista_tc WHEN 'TD' THEN c.rate_comisionista_td
          WHEN 'Amex' THEN c.rate_comisionista_amex WHEN 'TI' THEN c.rate_comisionista_ti ELSE 0 END
      ELSE COALESCE((SELECT r.rate FROM tpv_client_msi_rates r
            WHERE r.cliente_id = c.id AND r.plazo = t.plazo_msi
            AND r.entity = 'comisionista' AND r.card_type = t.card_type_key), 0)
    END * COALESCE(c.factor_iva, 1.16)), 0) AS com_comisionista,
    -- Monto neto = sum of all commissions + IVA
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_efevoo_tc + c.rate_salem_tc + c.rate_convenia_tc + c.rate_comisionista_tc
          WHEN 'TD' THEN c.rate_efevoo_td + c.rate_salem_td + c.rate_convenia_td + c.rate_comisionista_td
          WHEN 'Amex' THEN c.rate_efevoo_amex + c.rate_salem_amex + c.rate_convenia_amex + c.rate_comisionista_amex
          WHEN 'TI' THEN c.rate_efevoo_ti + c.rate_salem_ti + c.rate_convenia_ti + c.rate_comisionista_ti
          ELSE 0 END
      ELSE COALESCE((SELECT SUM(r.rate) FROM tpv_client_msi_rates r
            WHERE r.cliente_id = c.id AND r.plazo = t.plazo_msi
            AND r.card_type = t.card_type_key), 0)
    END * COALESCE(c.factor_iva, 1.16)), 0) AS monto_neto
  FROM tpv_clients c
  LEFT JOIN tpv_transactions t ON t.cliente_id = c.id
    AND (p_from IS NULL OR t.fecha >= p_from)
    AND (p_to IS NULL OR t.fecha <= p_to)
  GROUP BY c.id, c.nombre, c.nombre_display
  HAVING COALESCE(SUM(t.monto), 0) != 0
  ORDER BY monto_neto DESC;
$$;


-- ┌──────────────────────────────────────┐
-- │  3. tpv_agent_summary               │
-- │  3 cambios (salem, agente, pend.)  │
-- └──────────────────────────────────────┘
CREATE OR REPLACE FUNCTION tpv_agent_summary(
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL
) RETURNS TABLE(
  agente_id INT,
  agente TEXT,
  siglas TEXT,
  pct NUMERIC,
  vendido NUMERIC,
  com_salem NUMERIC,
  com_agente NUMERIC,
  num_clientes BIGINT,
  num_activos BIGINT,
  pagado NUMERIC,
  pendiente NUMERIC
) LANGUAGE sql STABLE AS $$
  SELECT
    a.id AS agente_id,
    a.nombre AS agente,
    a.siglas,
    a.pct_comision AS pct,
    COALESCE(SUM(t.monto), 0) AS vendido,
    -- Salem commission + IVA
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_salem_tc WHEN 'TD' THEN c.rate_salem_td
          WHEN 'Amex' THEN c.rate_salem_amex WHEN 'TI' THEN c.rate_salem_ti ELSE 0 END
      ELSE COALESCE((SELECT r.rate FROM tpv_client_msi_rates r
            WHERE r.cliente_id = c.id AND r.plazo = t.plazo_msi
            AND r.entity = 'salem' AND r.card_type = t.card_type_key), 0)
    END * COALESCE(c.factor_iva, 1.16)), 0) AS com_salem,
    -- Agent commission = salem * pct (IVA ya incluido en salem)
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_salem_tc WHEN 'TD' THEN c.rate_salem_td
          WHEN 'Amex' THEN c.rate_salem_amex WHEN 'TI' THEN c.rate_salem_ti ELSE 0 END
      ELSE COALESCE((SELECT r.rate FROM tpv_client_msi_rates r
            WHERE r.cliente_id = c.id AND r.plazo = t.plazo_msi
            AND r.entity = 'salem' AND r.card_type = t.card_type_key), 0)
    END * COALESCE(c.factor_iva, 1.16)), 0) * a.pct_comision AS com_agente,
    COUNT(DISTINCT c.id) AS num_clientes,
    COUNT(DISTINCT c.id) FILTER (WHERE t.fecha >= CURRENT_DATE - 30) AS num_activos,
    0::NUMERIC AS pagado,
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_salem_tc WHEN 'TD' THEN c.rate_salem_td
          WHEN 'Amex' THEN c.rate_salem_amex WHEN 'TI' THEN c.rate_salem_ti ELSE 0 END
      ELSE COALESCE((SELECT r.rate FROM tpv_client_msi_rates r
            WHERE r.cliente_id = c.id AND r.plazo = t.plazo_msi
            AND r.entity = 'salem' AND r.card_type = t.card_type_key), 0)
    END * COALESCE(c.factor_iva, 1.16)), 0) * a.pct_comision AS pendiente
  FROM tpv_agentes a
  LEFT JOIN tpv_clients c ON c.agente_id = a.id
  LEFT JOIN tpv_transactions t ON t.cliente_id = c.id
    AND (p_from IS NULL OR t.fecha >= p_from)
    AND (p_to IS NULL OR t.fecha <= p_to)
  WHERE a.activo = true
  GROUP BY a.id, a.nombre, a.siglas, a.pct_comision
  ORDER BY vendido DESC;
$$;


-- ┌──────────────────────────────────────┐
-- │  4. tpv_kpis                        │
-- │  5 cambios (total + 4 entidades)   │
-- └──────────────────────────────────────┘
CREATE OR REPLACE FUNCTION tpv_kpis(
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL
) RETURNS TABLE(
  total_cobrado NUMERIC,
  total_comisiones NUMERIC,
  com_efevoo NUMERIC,
  com_salem NUMERIC,
  com_convenia NUMERIC,
  com_comisionista NUMERIC,
  num_clientes BIGINT,
  num_transacciones BIGINT,
  num_terminales BIGINT
) LANGUAGE sql STABLE AS $$
  SELECT
    COALESCE(SUM(t.monto), 0) AS total_cobrado,
    -- Total commissions (all entities) + IVA
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 AND c.id IS NOT NULL THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_efevoo_tc + c.rate_salem_tc + c.rate_convenia_tc + c.rate_comisionista_tc
          WHEN 'TD' THEN c.rate_efevoo_td + c.rate_salem_td + c.rate_convenia_td + c.rate_comisionista_td
          WHEN 'Amex' THEN c.rate_efevoo_amex + c.rate_salem_amex + c.rate_convenia_amex + c.rate_comisionista_amex
          WHEN 'TI' THEN c.rate_efevoo_ti + c.rate_salem_ti + c.rate_convenia_ti + c.rate_comisionista_ti
          ELSE 0 END
        * COALESCE(c.factor_iva, 1.16)
      ELSE 0 END), 0) AS total_comisiones,
    -- Efevoo + IVA
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 AND c.id IS NOT NULL THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_efevoo_tc WHEN 'TD' THEN c.rate_efevoo_td
          WHEN 'Amex' THEN c.rate_efevoo_amex WHEN 'TI' THEN c.rate_efevoo_ti ELSE 0 END
        * COALESCE(c.factor_iva, 1.16)
      ELSE 0 END), 0) AS com_efevoo,
    -- Salem + IVA
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 AND c.id IS NOT NULL THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_salem_tc WHEN 'TD' THEN c.rate_salem_td
          WHEN 'Amex' THEN c.rate_salem_amex WHEN 'TI' THEN c.rate_salem_ti ELSE 0 END
        * COALESCE(c.factor_iva, 1.16)
      ELSE 0 END), 0) AS com_salem,
    -- Convenia + IVA
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 AND c.id IS NOT NULL THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_convenia_tc WHEN 'TD' THEN c.rate_convenia_td
          WHEN 'Amex' THEN c.rate_convenia_amex WHEN 'TI' THEN c.rate_convenia_ti ELSE 0 END
        * COALESCE(c.factor_iva, 1.16)
      ELSE 0 END), 0) AS com_convenia,
    -- Comisionista + IVA
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 AND c.id IS NOT NULL THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_comisionista_tc WHEN 'TD' THEN c.rate_comisionista_td
          WHEN 'Amex' THEN c.rate_comisionista_amex WHEN 'TI' THEN c.rate_comisionista_ti ELSE 0 END
        * COALESCE(c.factor_iva, 1.16)
      ELSE 0 END), 0) AS com_comisionista,
    COUNT(DISTINCT t.cliente_id) AS num_clientes,
    COUNT(*) AS num_transacciones,
    COUNT(DISTINCT t.terminal_id) AS num_terminales
  FROM tpv_transactions t
  LEFT JOIN tpv_clients c ON c.id = t.cliente_id
  WHERE (p_from IS NULL OR t.fecha >= p_from)
    AND (p_to IS NULL OR t.fecha <= p_to);
$$;
