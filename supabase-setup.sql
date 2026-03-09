-- ══════════════════════════════════════════════════════════
-- GF Dashboard — Setup de Supabase
-- Ejecutar este SQL en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════

-- TABLA 1: Key-Value Store para todos los datos de la app
CREATE TABLE IF NOT EXISTS app_data (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  TEXT DEFAULT NULL
);

-- Index para sincronización incremental
CREATE INDEX IF NOT EXISTS idx_app_data_updated ON app_data (updated_at);

-- Seed: insertar todas las keys conocidas con valores vacíos
INSERT INTO app_data (key, value) VALUES
  ('gf4',         '[]'::jsonb),
  ('gf_fi',       '[]'::jsonb),
  ('gf_fg',       '[]'::jsonb),
  ('gf_cred_end', '[]'::jsonb),
  ('gf_cred_dyn', '[]'::jsonb),
  ('gf_cc_hist',  '[]'::jsonb),
  ('gf_usuarios', '[]'::jsonb),
  ('gf_theme',    '"light"'::jsonb),
  ('gf_tesoreria','[]'::jsonb),
  ('gf_bancos',   '[]'::jsonb),
  ('gf_tpv_pagos','{}'::jsonb),
  ('gf_cat_cd',   '[]'::jsonb),
  ('gf_cat_ga',   '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- TABLA 2: Metadata de sincronización
CREATE TABLE IF NOT EXISTS sync_meta (
  client_id   TEXT PRIMARY KEY,
  last_sync   TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent  TEXT DEFAULT NULL
);

-- TABLA 3: Transacciones TPV (para futuro análisis de 600K+ filas)
CREATE TABLE IF NOT EXISTS tpv_transactions (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha         DATE NOT NULL,
  cliente       TEXT NOT NULL,
  terminal_id   TEXT,
  monto         NUMERIC(12,2) NOT NULL,
  comision_pct  NUMERIC(5,4),
  comision_mxn  NUMERIC(12,2),
  tipo          TEXT,
  banco         TEXT,
  agente        TEXT,
  periodo       TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tpv_periodo ON tpv_transactions (periodo);
CREATE INDEX IF NOT EXISTS idx_tpv_cliente ON tpv_transactions (cliente);
CREATE INDEX IF NOT EXISTS idx_tpv_agente  ON tpv_transactions (agente);

-- ══════════════════════════════════════════════════════════
-- RLS (Row Level Security) — Acceso permisivo para herramienta interna
-- ══════════════════════════════════════════════════════════
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpv_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_full_access_app_data"
  ON app_data FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_full_access_sync_meta"
  ON sync_meta FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_full_access_tpv"
  ON tpv_transactions FOR ALL
  USING (true)
  WITH CHECK (true);
