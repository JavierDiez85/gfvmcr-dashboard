-- ══════════════════════════════════════════════════════════
-- GFVMCR Dashboard — Supabase Schema V2
-- Módulo Terminales TPV: Tablas + Funciones RPC
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════

-- ┌──────────────────────────────────────┐
-- │  TABLA 1: tpv_agentes               │
-- └──────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS tpv_agentes (
  id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre          TEXT NOT NULL UNIQUE,
  siglas          TEXT NOT NULL,
  pct_comision    NUMERIC(5,4) DEFAULT 0.10,
  activo          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tpv_agentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access_tpv_agentes" ON tpv_agentes FOR ALL USING (true) WITH CHECK (true);

-- Seed: 8 agentes iniciales
INSERT INTO tpv_agentes (nombre, siglas, pct_comision) VALUES
  ('Angel Ahedo',      'AA', 0.10),
  ('Javier Diez',      'JD', 0.10),
  ('Emiliano Mendoza', 'EM', 0.10),
  ('Joaquin Vallejo',  'JV', 0.10),
  ('Adrian Roman',     'AR', 0.10),
  ('Monica Gonzalez',  'MG', 0.10),
  ('Jose de la Rosa',  'JR', 0.10),
  ('N/A',              'NA', 0.00)
ON CONFLICT (nombre) DO NOTHING;


-- ┌──────────────────────────────────────┐
-- │  TABLA 2: tpv_clients               │
-- │  Config de comisiones por cliente    │
-- └──────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS tpv_clients (
  id                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre                TEXT NOT NULL UNIQUE,
  nombre_display        TEXT,
  agente_id             INT REFERENCES tpv_agentes(id),
  promotor              TEXT DEFAULT 'Sin Promotor',
  entidad               TEXT,
  active_desde          DATE,
  active_hasta          DATE,
  factor_iva            NUMERIC(6,4) DEFAULT 1.16,
  -- Comisiones contado: 4 entidades × 4 tipos tarjeta = 16 tasas
  rate_efevoo_tc        NUMERIC(10,8) DEFAULT 0,
  rate_efevoo_td        NUMERIC(10,8) DEFAULT 0,
  rate_efevoo_amex      NUMERIC(10,8) DEFAULT 0,
  rate_efevoo_ti        NUMERIC(10,8) DEFAULT 0,
  rate_salem_tc         NUMERIC(10,8) DEFAULT 0,
  rate_salem_td         NUMERIC(10,8) DEFAULT 0,
  rate_salem_amex       NUMERIC(10,8) DEFAULT 0,
  rate_salem_ti         NUMERIC(10,8) DEFAULT 0,
  rate_convenia_tc      NUMERIC(10,8) DEFAULT 0,
  rate_convenia_td      NUMERIC(10,8) DEFAULT 0,
  rate_convenia_amex    NUMERIC(10,8) DEFAULT 0,
  rate_convenia_ti      NUMERIC(10,8) DEFAULT 0,
  rate_comisionista_tc  NUMERIC(10,8) DEFAULT 0,
  rate_comisionista_td  NUMERIC(10,8) DEFAULT 0,
  rate_comisionista_amex NUMERIC(10,8) DEFAULT 0,
  rate_comisionista_ti  NUMERIC(10,8) DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tpv_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access_tpv_clients" ON tpv_clients FOR ALL USING (true) WITH CHECK (true);


-- ┌──────────────────────────────────────┐
-- │  TABLA 3: tpv_client_msi_rates      │
-- │  Tasas MSI por cliente (variables)   │
-- └──────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS tpv_client_msi_rates (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cliente_id      INT NOT NULL REFERENCES tpv_clients(id) ON DELETE CASCADE,
  plazo           INT NOT NULL,             -- 3, 6, 9, 12
  entity          TEXT NOT NULL,            -- efevoo / salem / convenia / comisionista
  card_type       TEXT NOT NULL,            -- TC / Amex
  rate            NUMERIC(10,8) NOT NULL DEFAULT 0,
  UNIQUE(cliente_id, plazo, entity, card_type)
);

ALTER TABLE tpv_client_msi_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access_tpv_msi" ON tpv_client_msi_rates FOR ALL USING (true) WITH CHECK (true);


-- ┌──────────────────────────────────────┐
-- │  TABLA 4: tpv_upload_batches        │
-- │  Auditoría de uploads               │
-- └──────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS tpv_upload_batches (
  id              TEXT PRIMARY KEY,
  filename        TEXT,
  row_count       INT,
  date_range_from DATE,
  date_range_to   DATE,
  strategy        TEXT,
  uploaded_by     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tpv_upload_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access_tpv_batches" ON tpv_upload_batches FOR ALL USING (true) WITH CHECK (true);


-- ┌──────────────────────────────────────┐
-- │  TABLA 5: tpv_transactions          │
-- │  DROP + RECREAR con schema ampliado │
-- └──────────────────────────────────────┘
DROP TABLE IF EXISTS tpv_transactions CASCADE;

CREATE TABLE tpv_transactions (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Identidad
  excel_id            TEXT,
  upload_batch        TEXT REFERENCES tpv_upload_batches(id),
  -- Transacción
  adquiriente         TEXT NOT NULL,            -- Banorte / EfevooPay
  cliente             TEXT NOT NULL,
  cliente_id          INT REFERENCES tpv_clients(id),
  marca_tarjeta       TEXT,                     -- Visa / MC / Amex / Carnet
  metodo_pago         TEXT,                     -- Crédito / Débito / Prepago
  monto               NUMERIC(14,2) NOT NULL,
  fecha               DATE NOT NULL,
  hora                TIME,                     -- HH:MM:SS reconstruida
  -- REGLA DE NEGOCIO: Corte a las 11PM
  -- Día de liquidación = si hora >= 23:00 → fecha + 1, si no → fecha
  fecha_liquidacion   DATE,
  tipo_transaccion    TEXT NOT NULL,            -- PAGO / CANCELACIÓN / DEVOLUCIÓN / REVERSO / PAGO X MSI
  tipo_tarjeta        TEXT,                     -- Nacional / Internacional
  terminal_id         TEXT,
  mes                 TEXT,                     -- "YYYY-MM"
  -- Comisión Centumpay (del Excel)
  tasa_comision_cp    NUMERIC(8,6),
  monto_comision_cp   NUMERIC(12,2),
  iva_comision_cp     NUMERIC(12,2),
  -- Campos derivados para cálculos de comisiones
  card_type_key       TEXT,                     -- TC / TD / Amex / TI
  plazo_msi           INT DEFAULT 0,            -- 0=contado, 3/6/9/12
  -- Metadata
  sucursal            TEXT,
  modo_entrada        TEXT,                     -- chip / etc.
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Índices para las funciones RPC
CREATE INDEX idx_tpv_txn_fecha ON tpv_transactions (fecha);
CREATE INDEX idx_tpv_txn_fecha_liq ON tpv_transactions (fecha_liquidacion);
CREATE INDEX idx_tpv_txn_cliente ON tpv_transactions (cliente);
CREATE INDEX idx_tpv_txn_cliente_id ON tpv_transactions (cliente_id);
CREATE INDEX idx_tpv_txn_terminal ON tpv_transactions (terminal_id);
CREATE INDEX idx_tpv_txn_mes ON tpv_transactions (mes);
CREATE INDEX idx_tpv_txn_batch ON tpv_transactions (upload_batch);
CREATE INDEX idx_tpv_txn_tipo ON tpv_transactions (tipo_transaccion);
CREATE INDEX idx_tpv_txn_card_type ON tpv_transactions (card_type_key);

ALTER TABLE tpv_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access_tpv_txn" ON tpv_transactions FOR ALL USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════
-- FUNCIONES RPC — Reemplazan constantes hardcodeadas
-- ══════════════════════════════════════════════════════════

-- ┌──────────────────────────────────────┐
-- │  RPC 1: tpv_clients_by_volume       │
-- │  Reemplaza TPV_DG_CLIENTS y         │
-- │  TPV_D_CLIENTS                      │
-- └──────────────────────────────────────┘
CREATE OR REPLACE FUNCTION tpv_clients_by_volume(
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL
) RETURNS TABLE(
  client_id INT,
  cliente TEXT,
  monto_tc NUMERIC,
  monto_td NUMERIC,
  monto_amex NUMERIC,
  monto_ti NUMERIC,
  total NUMERIC,
  num_transacciones BIGINT
) LANGUAGE sql STABLE AS $$
  SELECT
    t.cliente_id,
    COALESCE(c.nombre_display, t.cliente) AS cliente,
    COALESCE(SUM(t.monto) FILTER (WHERE t.card_type_key = 'TC'), 0) AS monto_tc,
    COALESCE(SUM(t.monto) FILTER (WHERE t.card_type_key = 'TD'), 0) AS monto_td,
    COALESCE(SUM(t.monto) FILTER (WHERE t.card_type_key = 'Amex'), 0) AS monto_amex,
    COALESCE(SUM(t.monto) FILTER (WHERE t.card_type_key = 'TI'), 0) AS monto_ti,
    COALESCE(SUM(t.monto), 0) AS total,
    COUNT(*) AS num_transacciones
  FROM tpv_transactions t
  LEFT JOIN tpv_clients c ON c.id = t.cliente_id
  WHERE (p_from IS NULL OR t.fecha >= p_from)
    AND (p_to IS NULL OR t.fecha <= p_to)
  GROUP BY t.cliente_id, COALESCE(c.nombre_display, t.cliente)
  ORDER BY total DESC;
$$;


-- ┌──────────────────────────────────────┐
-- │  RPC 2: tpv_commission_mix          │
-- │  Mix de comisiones por entidad      │
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
      WHEN 'Amex' THEN c.rate_efevoo_amex WHEN 'TI' THEN c.rate_efevoo_ti ELSE 0 END), 0),
    COALESCE(SUM(b.monto), 0)
  FROM base b JOIN tpv_clients c ON c.id = b.cliente_id
  WHERE b.plazo_msi = 0
  UNION ALL
  -- Salem
  SELECT 'Salem'::TEXT,
    COALESCE(SUM(b.monto * CASE b.card_type_key
      WHEN 'TC' THEN c.rate_salem_tc WHEN 'TD' THEN c.rate_salem_td
      WHEN 'Amex' THEN c.rate_salem_amex WHEN 'TI' THEN c.rate_salem_ti ELSE 0 END), 0),
    COALESCE(SUM(b.monto), 0)
  FROM base b JOIN tpv_clients c ON c.id = b.cliente_id
  WHERE b.plazo_msi = 0
  UNION ALL
  -- Convenia
  SELECT 'Convenia'::TEXT,
    COALESCE(SUM(b.monto * CASE b.card_type_key
      WHEN 'TC' THEN c.rate_convenia_tc WHEN 'TD' THEN c.rate_convenia_td
      WHEN 'Amex' THEN c.rate_convenia_amex WHEN 'TI' THEN c.rate_convenia_ti ELSE 0 END), 0),
    COALESCE(SUM(b.monto), 0)
  FROM base b JOIN tpv_clients c ON c.id = b.cliente_id
  WHERE b.plazo_msi = 0
  UNION ALL
  -- Comisionista
  SELECT 'Comisionista'::TEXT,
    COALESCE(SUM(b.monto * CASE b.card_type_key
      WHEN 'TC' THEN c.rate_comisionista_tc WHEN 'TD' THEN c.rate_comisionista_td
      WHEN 'Amex' THEN c.rate_comisionista_amex WHEN 'TI' THEN c.rate_comisionista_ti ELSE 0 END), 0),
    COALESCE(SUM(b.monto), 0)
  FROM base b JOIN tpv_clients c ON c.id = b.cliente_id
  WHERE b.plazo_msi = 0;
$$;


-- ┌──────────────────────────────────────┐
-- │  RPC 3: tpv_client_commissions      │
-- │  Comisiones netas por cliente       │
-- │  (reemplaza TPV_PAGOS)             │
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
    -- Efevoo commission
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_efevoo_tc WHEN 'TD' THEN c.rate_efevoo_td
          WHEN 'Amex' THEN c.rate_efevoo_amex WHEN 'TI' THEN c.rate_efevoo_ti ELSE 0 END
      ELSE COALESCE((SELECT r.rate FROM tpv_client_msi_rates r
            WHERE r.cliente_id = c.id AND r.plazo = t.plazo_msi
            AND r.entity = 'efevoo' AND r.card_type = t.card_type_key), 0)
    END), 0) AS com_efevoo,
    -- Salem commission
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_salem_tc WHEN 'TD' THEN c.rate_salem_td
          WHEN 'Amex' THEN c.rate_salem_amex WHEN 'TI' THEN c.rate_salem_ti ELSE 0 END
      ELSE COALESCE((SELECT r.rate FROM tpv_client_msi_rates r
            WHERE r.cliente_id = c.id AND r.plazo = t.plazo_msi
            AND r.entity = 'salem' AND r.card_type = t.card_type_key), 0)
    END), 0) AS com_salem,
    -- Convenia commission
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_convenia_tc WHEN 'TD' THEN c.rate_convenia_td
          WHEN 'Amex' THEN c.rate_convenia_amex WHEN 'TI' THEN c.rate_convenia_ti ELSE 0 END
      ELSE COALESCE((SELECT r.rate FROM tpv_client_msi_rates r
            WHERE r.cliente_id = c.id AND r.plazo = t.plazo_msi
            AND r.entity = 'convenia' AND r.card_type = t.card_type_key), 0)
    END), 0) AS com_convenia,
    -- Comisionista commission
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_comisionista_tc WHEN 'TD' THEN c.rate_comisionista_td
          WHEN 'Amex' THEN c.rate_comisionista_amex WHEN 'TI' THEN c.rate_comisionista_ti ELSE 0 END
      ELSE COALESCE((SELECT r.rate FROM tpv_client_msi_rates r
            WHERE r.cliente_id = c.id AND r.plazo = t.plazo_msi
            AND r.entity = 'comisionista' AND r.card_type = t.card_type_key), 0)
    END), 0) AS com_comisionista,
    -- Monto neto = sum of all commissions
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
    END), 0) AS monto_neto
  FROM tpv_clients c
  LEFT JOIN tpv_transactions t ON t.cliente_id = c.id
    AND (p_from IS NULL OR t.fecha >= p_from)
    AND (p_to IS NULL OR t.fecha <= p_to)
  GROUP BY c.id, c.nombre, c.nombre_display
  HAVING COALESCE(SUM(t.monto), 0) != 0
  ORDER BY monto_neto DESC;
$$;


-- ┌──────────────────────────────────────┐
-- │  RPC 4: tpv_agent_summary           │
-- │  Reemplaza TPV_AGENTES             │
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
    -- Salem commission for contado
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_salem_tc WHEN 'TD' THEN c.rate_salem_td
          WHEN 'Amex' THEN c.rate_salem_amex WHEN 'TI' THEN c.rate_salem_ti ELSE 0 END
      ELSE COALESCE((SELECT r.rate FROM tpv_client_msi_rates r
            WHERE r.cliente_id = c.id AND r.plazo = t.plazo_msi
            AND r.entity = 'salem' AND r.card_type = t.card_type_key), 0)
    END), 0) AS com_salem,
    -- Agent commission = salem * pct
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_salem_tc WHEN 'TD' THEN c.rate_salem_td
          WHEN 'Amex' THEN c.rate_salem_amex WHEN 'TI' THEN c.rate_salem_ti ELSE 0 END
      ELSE COALESCE((SELECT r.rate FROM tpv_client_msi_rates r
            WHERE r.cliente_id = c.id AND r.plazo = t.plazo_msi
            AND r.entity = 'salem' AND r.card_type = t.card_type_key), 0)
    END), 0) * a.pct_comision AS com_agente,
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
    END), 0) * a.pct_comision AS pendiente
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
-- │  RPC 5: tpv_terminal_status         │
-- │  Reemplaza TPV_TERMINALES          │
-- └──────────────────────────────────────┘
CREATE OR REPLACE FUNCTION tpv_terminal_status(
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL
) RETURNS TABLE(
  cliente TEXT,
  num_term BIGINT,
  terminal_id TEXT,
  ultimo_uso DATE,
  ingresos NUMERIC,
  transacciones BIGINT,
  promedio NUMERIC,
  dias_sin_uso INT
) LANGUAGE sql STABLE AS $$
  WITH term_stats AS (
    SELECT
      COALESCE(c.nombre_display, t.cliente) AS cliente,
      t.terminal_id,
      MAX(t.fecha) AS ultimo_uso,
      SUM(t.monto) AS ingresos,
      COUNT(*) AS transacciones,
      CASE WHEN COUNT(*) > 0 THEN SUM(t.monto) / COUNT(*) ELSE 0 END AS promedio
    FROM tpv_transactions t
    LEFT JOIN tpv_clients c ON c.id = t.cliente_id
    WHERE t.terminal_id IS NOT NULL
      AND (p_from IS NULL OR t.fecha >= p_from)
      AND (p_to IS NULL OR t.fecha <= p_to)
    GROUP BY COALESCE(c.nombre_display, t.cliente), t.terminal_id
  )
  SELECT
    ts.cliente,
    COUNT(*) OVER (PARTITION BY ts.cliente) AS num_term,
    ts.terminal_id,
    ts.ultimo_uso,
    ts.ingresos,
    ts.transacciones,
    ts.promedio,
    (CURRENT_DATE - ts.ultimo_uso)::INT AS dias_sin_uso
  FROM term_stats ts
  ORDER BY ts.ingresos DESC;
$$;


-- ┌──────────────────────────────────────┐
-- │  RPC 6: tpv_terminal_changes        │
-- │  Reemplaza TPV_CAMBIOS             │
-- └──────────────────────────────────────┘
CREATE OR REPLACE FUNCTION tpv_terminal_changes()
RETURNS TABLE(
  num BIGINT,
  terminal TEXT,
  cliente_ant TEXT,
  fecha_ant_ini DATE,
  fecha_ant_fin DATE,
  txns_ant BIGINT,
  monto_ant NUMERIC,
  tipo TEXT,
  cliente_act TEXT,
  fecha_act_ini DATE,
  fecha_act_fin DATE,
  txns_act BIGINT
) LANGUAGE sql STABLE AS $$
  WITH terminal_clients AS (
    SELECT
      t.terminal_id,
      COALESCE(c.nombre_display, t.cliente) AS cliente,
      MIN(t.fecha) AS fecha_ini,
      MAX(t.fecha) AS fecha_fin,
      COUNT(*) AS txns,
      SUM(t.monto) AS monto,
      ROW_NUMBER() OVER (PARTITION BY t.terminal_id ORDER BY MIN(t.fecha)) AS rn
    FROM tpv_transactions t
    LEFT JOIN tpv_clients c ON c.id = t.cliente_id
    WHERE t.terminal_id IS NOT NULL
    GROUP BY t.terminal_id, COALESCE(c.nombre_display, t.cliente)
  ),
  changes AS (
    SELECT
      prev.terminal_id,
      prev.cliente AS cliente_ant,
      prev.fecha_ini AS fecha_ant_ini,
      prev.fecha_fin AS fecha_ant_fin,
      prev.txns AS txns_ant,
      prev.monto AS monto_ant,
      curr.cliente AS cliente_act,
      curr.fecha_ini AS fecha_act_ini,
      curr.fecha_fin AS fecha_act_fin,
      curr.txns AS txns_act,
      CASE WHEN prev.fecha_fin >= curr.fecha_ini
           THEN '⚠️ Solapamiento' ELSE '✅ Limpio' END AS tipo
    FROM terminal_clients prev
    JOIN terminal_clients curr ON prev.terminal_id = curr.terminal_id
      AND curr.rn = prev.rn + 1
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY ch.fecha_ant_ini) AS num,
    ch.terminal_id AS terminal,
    ch.cliente_ant, ch.fecha_ant_ini, ch.fecha_ant_fin, ch.txns_ant, ch.monto_ant,
    ch.tipo,
    ch.cliente_act, ch.fecha_act_ini, ch.fecha_act_fin, ch.txns_act
  FROM changes ch
  ORDER BY ch.fecha_ant_ini;
$$;


-- ┌──────────────────────────────────────┐
-- │  RPC 7: tpv_kpis                    │
-- │  KPIs para dashboard general        │
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
    -- Total commissions (all entities)
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 AND c.id IS NOT NULL THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_efevoo_tc + c.rate_salem_tc + c.rate_convenia_tc + c.rate_comisionista_tc
          WHEN 'TD' THEN c.rate_efevoo_td + c.rate_salem_td + c.rate_convenia_td + c.rate_comisionista_td
          WHEN 'Amex' THEN c.rate_efevoo_amex + c.rate_salem_amex + c.rate_convenia_amex + c.rate_comisionista_amex
          WHEN 'TI' THEN c.rate_efevoo_ti + c.rate_salem_ti + c.rate_convenia_ti + c.rate_comisionista_ti
          ELSE 0 END
      ELSE 0 END), 0) AS total_comisiones,
    -- Efevoo
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 AND c.id IS NOT NULL THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_efevoo_tc WHEN 'TD' THEN c.rate_efevoo_td
          WHEN 'Amex' THEN c.rate_efevoo_amex WHEN 'TI' THEN c.rate_efevoo_ti ELSE 0 END
      ELSE 0 END), 0) AS com_efevoo,
    -- Salem
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 AND c.id IS NOT NULL THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_salem_tc WHEN 'TD' THEN c.rate_salem_td
          WHEN 'Amex' THEN c.rate_salem_amex WHEN 'TI' THEN c.rate_salem_ti ELSE 0 END
      ELSE 0 END), 0) AS com_salem,
    -- Convenia
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 AND c.id IS NOT NULL THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_convenia_tc WHEN 'TD' THEN c.rate_convenia_td
          WHEN 'Amex' THEN c.rate_convenia_amex WHEN 'TI' THEN c.rate_convenia_ti ELSE 0 END
      ELSE 0 END), 0) AS com_convenia,
    -- Comisionista
    COALESCE(SUM(t.monto * CASE
      WHEN t.plazo_msi = 0 AND c.id IS NOT NULL THEN
        CASE t.card_type_key
          WHEN 'TC' THEN c.rate_comisionista_tc WHEN 'TD' THEN c.rate_comisionista_td
          WHEN 'Amex' THEN c.rate_comisionista_amex WHEN 'TI' THEN c.rate_comisionista_ti ELSE 0 END
      ELSE 0 END), 0) AS com_comisionista,
    COUNT(DISTINCT t.cliente_id) AS num_clientes,
    COUNT(*) AS num_transacciones,
    COUNT(DISTINCT t.terminal_id) AS num_terminales
  FROM tpv_transactions t
  LEFT JOIN tpv_clients c ON c.id = t.cliente_id
  WHERE (p_from IS NULL OR t.fecha >= p_from)
    AND (p_to IS NULL OR t.fecha <= p_to);
$$;
