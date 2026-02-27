-- ══════════════════════════════════════════════════════════
-- GFVMCR Dashboard — Supabase Schema: Tarjetas CENTUM
-- Tablas + Funciones RPC para módulo de Tarjetas
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════


-- ┌──────────────────────────────────────┐
-- │  TABLA 1: tar_upload_batches        │
-- │  Auditoría de cargas                │
-- └──────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS tar_upload_batches (
  id              TEXT PRIMARY KEY,
  filename        TEXT,
  txn_count       INT DEFAULT 0,
  card_count      INT DEFAULT 0,
  date_range_from DATE,
  date_range_to   DATE,
  strategy        TEXT,
  uploaded_by     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tar_upload_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access_tar_batches" ON tar_upload_batches FOR ALL USING (true) WITH CHECK (true);


-- ┌──────────────────────────────────────┐
-- │  TABLA 2: tar_transactions          │
-- │  Transacciones de tarjetas          │
-- └──────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS tar_transactions (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  upload_batch    TEXT REFERENCES tar_upload_batches(id),
  -- Identidad
  excel_id        TEXT,
  id_interno      TEXT,
  id_operacion    TEXT,
  nombre          TEXT,
  id_tarjeta      INT,
  tarjeta         TEXT,
  -- Relaciones
  cliente         TEXT,
  subcliente      TEXT,
  email           TEXT,
  -- Fecha / Hora
  fecha           DATE NOT NULL,
  hora            TIME,
  -- Transacción
  tipo            TEXT NOT NULL,       -- "Cargo" / "Abono"
  concepto        TEXT,                -- "COMPRA", "RECHAZADA", etc. (23 valores)
  descripcion     TEXT,
  observaciones   TEXT,
  monto           NUMERIC(14,2) NOT NULL DEFAULT 0,
  -- Derivados
  mes             TEXT,                -- "YYYY-MM"
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Índices para funciones RPC
CREATE INDEX IF NOT EXISTS idx_tar_txn_fecha ON tar_transactions(fecha);
CREATE INDEX IF NOT EXISTS idx_tar_txn_tipo ON tar_transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_tar_txn_concepto ON tar_transactions(concepto);
CREATE INDEX IF NOT EXISTS idx_tar_txn_subcliente ON tar_transactions(subcliente);
CREATE INDEX IF NOT EXISTS idx_tar_txn_mes ON tar_transactions(mes);
CREATE INDEX IF NOT EXISTS idx_tar_txn_batch ON tar_transactions(upload_batch);

ALTER TABLE tar_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access_tar_txn" ON tar_transactions FOR ALL USING (true) WITH CHECK (true);


-- ┌──────────────────────────────────────┐
-- │  TABLA 3: tar_cardholders           │
-- │  Tarjetahabientes (snapshot)        │
-- └──────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS tar_cardholders (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  upload_batch    TEXT REFERENCES tar_upload_batches(id),
  excel_id        TEXT,
  cliente         TEXT,
  nombre          TEXT NOT NULL,
  email           TEXT,
  tarjeta         TEXT,
  estado          TEXT,                -- "Activa" / "Bloqueada" / "Inactiva"
  telefono        TEXT,
  saldo           NUMERIC(14,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tar_ch_estado ON tar_cardholders(estado);
CREATE INDEX IF NOT EXISTS idx_tar_ch_cliente ON tar_cardholders(cliente);
CREATE INDEX IF NOT EXISTS idx_tar_ch_batch ON tar_cardholders(upload_batch);

ALTER TABLE tar_cardholders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access_tar_ch" ON tar_cardholders FOR ALL USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════
-- FUNCIONES RPC
-- ══════════════════════════════════════════════════════════


-- ┌──────────────────────────────────────┐
-- │  RPC 1: tar_dashboard_kpis          │
-- │  KPIs principales del dashboard     │
-- └──────────────────────────────────────┘
CREATE OR REPLACE FUNCTION tar_dashboard_kpis()
RETURNS TABLE (
  total_txns       BIGINT,
  monto_total      NUMERIC,
  total_cargos     NUMERIC,
  total_abonos     NUMERIC,
  txns_cargos      BIGINT,
  txns_abonos      BIGINT,
  tarjetas_activas BIGINT,
  tarjetas_total   BIGINT,
  saldo_total      NUMERIC,
  rechazadas       BIGINT,
  tasa_rechazo     NUMERIC,
  ticket_promedio  NUMERIC,
  fecha_min        DATE,
  fecha_max        DATE
) LANGUAGE sql STABLE AS $$
  WITH txn_stats AS (
    SELECT
      COUNT(*)                                          AS total_txns,
      COALESCE(SUM(monto), 0)                           AS monto_total,
      COALESCE(SUM(CASE WHEN tipo = 'Cargo' THEN monto ELSE 0 END), 0) AS total_cargos,
      COALESCE(SUM(CASE WHEN tipo = 'Abono' THEN monto ELSE 0 END), 0) AS total_abonos,
      COUNT(CASE WHEN tipo = 'Cargo' THEN 1 END)        AS txns_cargos,
      COUNT(CASE WHEN tipo = 'Abono' THEN 1 END)        AS txns_abonos,
      COUNT(CASE WHEN concepto = 'RECHAZADA' THEN 1 END) AS rechazadas,
      MIN(fecha)                                         AS fecha_min,
      MAX(fecha)                                         AS fecha_max
    FROM tar_transactions
  ),
  card_stats AS (
    SELECT
      COUNT(CASE WHEN estado = 'Activa' THEN 1 END)     AS tarjetas_activas,
      COUNT(*)                                           AS tarjetas_total,
      COALESCE(SUM(saldo), 0)                            AS saldo_total
    FROM tar_cardholders
  )
  SELECT
    t.total_txns,
    t.monto_total,
    t.total_cargos,
    t.total_abonos,
    t.txns_cargos,
    t.txns_abonos,
    c.tarjetas_activas,
    c.tarjetas_total,
    c.saldo_total,
    t.rechazadas,
    CASE WHEN t.total_txns > 0
      THEN ROUND(t.rechazadas::NUMERIC / t.total_txns * 100, 1)
      ELSE 0
    END AS tasa_rechazo,
    CASE WHEN t.total_txns > 0
      THEN ROUND(t.monto_total / t.total_txns, 0)
      ELSE 0
    END AS ticket_promedio,
    t.fecha_min,
    t.fecha_max
  FROM txn_stats t, card_stats c;
$$;


-- ┌──────────────────────────────────────┐
-- │  RPC 2: tar_by_concepto             │
-- │  Desglose por tipo de concepto      │
-- └──────────────────────────────────────┘
CREATE OR REPLACE FUNCTION tar_by_concepto()
RETURNS TABLE (
  concepto     TEXT,
  txn_count    BIGINT,
  monto        NUMERIC,
  pct_txns     NUMERIC,
  pct_monto    NUMERIC,
  ticket_avg   NUMERIC
) LANGUAGE sql STABLE AS $$
  WITH totals AS (
    SELECT COUNT(*) AS tot_txns, COALESCE(SUM(monto), 0) AS tot_monto
    FROM tar_transactions
  ),
  by_concepto AS (
    SELECT
      COALESCE(t.concepto, 'Otros') AS concepto,
      COUNT(*)                      AS txn_count,
      COALESCE(SUM(t.monto), 0)    AS monto
    FROM tar_transactions t
    GROUP BY COALESCE(t.concepto, 'Otros')
  )
  SELECT
    bc.concepto,
    bc.txn_count,
    bc.monto,
    CASE WHEN tot.tot_txns > 0
      THEN ROUND(bc.txn_count::NUMERIC / tot.tot_txns * 100, 1)
      ELSE 0
    END AS pct_txns,
    CASE WHEN tot.tot_monto > 0
      THEN ROUND(bc.monto / tot.tot_monto * 100, 1)
      ELSE 0
    END AS pct_monto,
    CASE WHEN bc.txn_count > 0
      THEN ROUND(bc.monto / bc.txn_count, 0)
      ELSE 0
    END AS ticket_avg
  FROM by_concepto bc, totals tot
  ORDER BY bc.monto DESC;
$$;


-- ┌──────────────────────────────────────┐
-- │  RPC 3: tar_by_subcliente           │
-- │  Top subclientes por monto          │
-- └──────────────────────────────────────┘
CREATE OR REPLACE FUNCTION tar_by_subcliente()
RETURNS TABLE (
  subcliente   TEXT,
  txn_count    BIGINT,
  monto        NUMERIC,
  pct          NUMERIC
) LANGUAGE sql STABLE AS $$
  WITH totals AS (
    SELECT COALESCE(SUM(monto), 0) AS tot_monto
    FROM tar_transactions
  )
  SELECT
    COALESCE(t.subcliente, '-') AS subcliente,
    COUNT(*)                    AS txn_count,
    COALESCE(SUM(t.monto), 0)  AS monto,
    CASE WHEN tot.tot_monto > 0
      THEN ROUND(SUM(t.monto) / tot.tot_monto * 100, 2)
      ELSE 0
    END AS pct
  FROM tar_transactions t, totals tot
  GROUP BY COALESCE(t.subcliente, '-'), tot.tot_monto
  ORDER BY monto DESC
  LIMIT 50;
$$;


-- ┌──────────────────────────────────────┐
-- │  RPC 4: tar_rechazos_detail         │
-- │  Rechazos agrupados por razón       │
-- └──────────────────────────────────────┘
CREATE OR REPLACE FUNCTION tar_rechazos_detail()
RETURNS TABLE (
  razon        TEXT,
  txn_count    BIGINT,
  monto        NUMERIC,
  pct          NUMERIC
) LANGUAGE sql STABLE AS $$
  WITH rechazos AS (
    SELECT
      COALESCE(NULLIF(descripcion, ''), 'Sin descripción') AS razon,
      COUNT(*)              AS txn_count,
      COALESCE(SUM(monto), 0) AS monto
    FROM tar_transactions
    WHERE concepto = 'RECHAZADA'
    GROUP BY COALESCE(NULLIF(descripcion, ''), 'Sin descripción')
  ),
  totals AS (
    SELECT COALESCE(SUM(txn_count), 0) AS tot FROM rechazos
  )
  SELECT
    r.razon,
    r.txn_count,
    r.monto,
    CASE WHEN t.tot > 0
      THEN ROUND(r.txn_count::NUMERIC / t.tot * 100, 1)
      ELSE 0
    END AS pct
  FROM rechazos r, totals t
  ORDER BY r.txn_count DESC;
$$;


-- ┌──────────────────────────────────────┐
-- │  RPC 5: tar_cardholders_summary     │
-- │  Resumen de tarjetahabientes        │
-- └──────────────────────────────────────┘
CREATE OR REPLACE FUNCTION tar_cardholders_summary()
RETURNS JSON LANGUAGE sql STABLE AS $$
  SELECT json_build_object(
    'by_estado', (
      SELECT json_agg(row_to_json(e))
      FROM (
        SELECT estado, COUNT(*) AS count, COALESCE(SUM(saldo), 0) AS saldo_total
        FROM tar_cardholders
        GROUP BY estado
        ORDER BY count DESC
      ) e
    ),
    'saldo_ranges', (
      SELECT json_agg(row_to_json(s))
      FROM (
        SELECT
          range_label,
          COUNT(*) AS count,
          COALESCE(SUM(saldo), 0) AS saldo_total
        FROM (
          SELECT
            saldo,
            CASE
              WHEN saldo < 0 THEN 'Negativo (< $0)'
              WHEN saldo <= 100 THEN '$0 - $100'
              WHEN saldo <= 1000 THEN '$100 - $1,000'
              WHEN saldo <= 10000 THEN '$1,000 - $10,000'
              WHEN saldo <= 50000 THEN '$10,000 - $50,000'
              ELSE '> $50,000'
            END AS range_label
          FROM tar_cardholders
        ) ranges
        GROUP BY range_label
        ORDER BY MIN(saldo)
      ) s
    ),
    'top_clientes', (
      SELECT json_agg(row_to_json(c))
      FROM (
        SELECT
          COALESCE(cliente, '-') AS cliente,
          COUNT(*) AS tarjetas,
          COALESCE(SUM(saldo), 0) AS saldo_total
        FROM tar_cardholders
        GROUP BY COALESCE(cliente, '-')
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) c
    ),
    'totals', (
      SELECT row_to_json(t)
      FROM (
        SELECT
          COUNT(*) AS total,
          COUNT(CASE WHEN estado = 'Activa' THEN 1 END) AS activas,
          COUNT(CASE WHEN estado = 'Bloqueada' THEN 1 END) AS bloqueadas,
          COUNT(CASE WHEN estado = 'Inactiva' THEN 1 END) AS inactivas,
          COALESCE(SUM(saldo), 0) AS saldo_total
        FROM tar_cardholders
      ) t
    )
  );
$$;


-- ┌──────────────────────────────────────┐
-- │  RPC 6: tar_activity_by_weekday     │
-- │  Actividad por día de la semana     │
-- └──────────────────────────────────────┘
CREATE OR REPLACE FUNCTION tar_activity_by_weekday()
RETURNS TABLE (
  weekday      INT,
  day_name     TEXT,
  txn_count    BIGINT,
  monto        NUMERIC
) LANGUAGE sql STABLE AS $$
  SELECT
    EXTRACT(DOW FROM fecha)::INT AS weekday,
    CASE EXTRACT(DOW FROM fecha)::INT
      WHEN 0 THEN 'Dom'
      WHEN 1 THEN 'Lun'
      WHEN 2 THEN 'Mar'
      WHEN 3 THEN 'Mié'
      WHEN 4 THEN 'Jue'
      WHEN 5 THEN 'Vie'
      WHEN 6 THEN 'Sáb'
    END AS day_name,
    COUNT(*) AS txn_count,
    COALESCE(SUM(monto), 0) AS monto
  FROM tar_transactions
  GROUP BY EXTRACT(DOW FROM fecha)::INT
  ORDER BY
    CASE EXTRACT(DOW FROM fecha)::INT
      WHEN 0 THEN 7
      ELSE EXTRACT(DOW FROM fecha)::INT
    END;
$$;
