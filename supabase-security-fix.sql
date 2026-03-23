-- ═══════════════════════════════════════════════════════════════
-- GF Dashboard — Supabase Security Fixes
-- Ejecutar en Supabase SQL Editor (Dashboard > SQL Editor)
-- Fecha: 2026-03-23
-- ═══════════════════════════════════════════════════════════════
-- Fixes:
--   1. Function Search Path Mutable (13 funciones) → SET search_path = public
--   2. RLS Policy Always True (12 políticas) → separar por operación
--      - SELECT / INSERT / UPDATE: permitido para anon (key public)
--      - DELETE: solo service_role (via server endpoints)
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
-- PARTE 1: FIX FUNCTION SEARCH PATH (13 funciones)
-- Previene ataques de schema injection
-- ═══════════════════════════════════════════════════════════════

ALTER FUNCTION tpv_clients_by_volume(DATE, DATE)    SET search_path = public;
ALTER FUNCTION tpv_commission_mix(DATE, DATE)        SET search_path = public;
ALTER FUNCTION tpv_client_commissions(DATE, DATE)   SET search_path = public;
ALTER FUNCTION tpv_agent_summary(DATE, DATE)         SET search_path = public;
ALTER FUNCTION tpv_terminal_status(DATE, DATE)       SET search_path = public;
ALTER FUNCTION tpv_terminal_changes()                SET search_path = public;
ALTER FUNCTION tpv_kpis(DATE, DATE)                  SET search_path = public;
ALTER FUNCTION tar_dashboard_kpis()                  SET search_path = public;
ALTER FUNCTION tar_by_concepto()                     SET search_path = public;
ALTER FUNCTION tar_by_subcliente()                   SET search_path = public;
ALTER FUNCTION tar_rechazos_detail()                 SET search_path = public;
ALTER FUNCTION tar_cardholders_summary()             SET search_path = public;
ALTER FUNCTION tar_activity_by_weekday()             SET search_path = public;


-- ═══════════════════════════════════════════════════════════════
-- PARTE 2: RLS POLICIES — Restricción de DELETE a service_role
-- Las operaciones DELETE peligrosas se hacen via server endpoints
-- que usan la service key. El browser solo puede SELECT/INSERT/UPDATE.
-- ═══════════════════════════════════════════════════════════════

-- ── tpv_transactions ──────────────────────────────────────────
DROP POLICY IF EXISTS "anon_full_access_tpv_txn"  ON tpv_transactions;
DROP POLICY IF EXISTS "anon_full_access_tpv"       ON tpv_transactions;

CREATE POLICY "tpv_txn_select"  ON tpv_transactions FOR SELECT USING (true);
CREATE POLICY "tpv_txn_insert"  ON tpv_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "tpv_txn_update"  ON tpv_transactions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "tpv_txn_delete"  ON tpv_transactions FOR DELETE
  USING (auth.role() = 'service_role');

-- ── tpv_clients ───────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_full_access_tpv_clients" ON tpv_clients;

CREATE POLICY "tpv_clients_select" ON tpv_clients FOR SELECT USING (true);
CREATE POLICY "tpv_clients_insert" ON tpv_clients FOR INSERT WITH CHECK (true);
CREATE POLICY "tpv_clients_update" ON tpv_clients FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "tpv_clients_delete" ON tpv_clients FOR DELETE
  USING (auth.role() = 'service_role');

-- ── tpv_client_msi_rates ──────────────────────────────────────
DROP POLICY IF EXISTS "anon_full_access_tpv_msi" ON tpv_client_msi_rates;

CREATE POLICY "tpv_msi_select" ON tpv_client_msi_rates FOR SELECT USING (true);
CREATE POLICY "tpv_msi_insert" ON tpv_client_msi_rates FOR INSERT WITH CHECK (true);
CREATE POLICY "tpv_msi_update" ON tpv_client_msi_rates FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "tpv_msi_delete" ON tpv_client_msi_rates FOR DELETE
  USING (auth.role() = 'service_role');

-- ── tpv_agentes ───────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_full_access_tpv_agentes" ON tpv_agentes;

CREATE POLICY "tpv_agentes_select" ON tpv_agentes FOR SELECT USING (true);
CREATE POLICY "tpv_agentes_insert" ON tpv_agentes FOR INSERT WITH CHECK (true);
CREATE POLICY "tpv_agentes_update" ON tpv_agentes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "tpv_agentes_delete" ON tpv_agentes FOR DELETE
  USING (auth.role() = 'service_role');

-- ── tpv_upload_batches ────────────────────────────────────────
DROP POLICY IF EXISTS "anon_full_access_tpv_batches" ON tpv_upload_batches;

CREATE POLICY "tpv_batches_select" ON tpv_upload_batches FOR SELECT USING (true);
CREATE POLICY "tpv_batches_insert" ON tpv_upload_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "tpv_batches_update" ON tpv_upload_batches FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "tpv_batches_delete" ON tpv_upload_batches FOR DELETE
  USING (auth.role() = 'service_role');

-- ── tar_transactions ──────────────────────────────────────────
DROP POLICY IF EXISTS "anon_full_access_tar_txn" ON tar_transactions;

CREATE POLICY "tar_txn_select" ON tar_transactions FOR SELECT USING (true);
CREATE POLICY "tar_txn_insert" ON tar_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "tar_txn_update" ON tar_transactions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "tar_txn_delete" ON tar_transactions FOR DELETE
  USING (auth.role() = 'service_role');

-- ── tar_cardholders ───────────────────────────────────────────
DROP POLICY IF EXISTS "anon_full_access_tar_ch" ON tar_cardholders;

CREATE POLICY "tar_ch_select" ON tar_cardholders FOR SELECT USING (true);
CREATE POLICY "tar_ch_insert" ON tar_cardholders FOR INSERT WITH CHECK (true);
CREATE POLICY "tar_ch_update" ON tar_cardholders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "tar_ch_delete" ON tar_cardholders FOR DELETE
  USING (auth.role() = 'service_role');

-- ── tar_upload_batches ────────────────────────────────────────
DROP POLICY IF EXISTS "anon_full_access_tar_batches" ON tar_upload_batches;

CREATE POLICY "tar_batches_select" ON tar_upload_batches FOR SELECT USING (true);
CREATE POLICY "tar_batches_insert" ON tar_upload_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "tar_batches_update" ON tar_upload_batches FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "tar_batches_delete" ON tar_upload_batches FOR DELETE
  USING (auth.role() = 'service_role');

-- ── app_data (key-value store) ────────────────────────────────
-- El browser escribe/lee via DB.set/get (no hace DELETE).
-- El servidor puede hacer DELETE si es necesario con service_role.
DROP POLICY IF EXISTS "anon_full_access_app_data" ON app_data;

CREATE POLICY "app_data_select" ON app_data FOR SELECT USING (true);
CREATE POLICY "app_data_insert" ON app_data FOR INSERT WITH CHECK (true);
CREATE POLICY "app_data_update" ON app_data FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "app_data_delete" ON app_data FOR DELETE
  USING (auth.role() = 'service_role');

-- ── sync_meta ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_full_access_sync_meta" ON sync_meta;

CREATE POLICY "sync_meta_select" ON sync_meta FOR SELECT USING (true);
CREATE POLICY "sync_meta_insert" ON sync_meta FOR INSERT WITH CHECK (true);
CREATE POLICY "sync_meta_update" ON sync_meta FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "sync_meta_delete" ON sync_meta FOR DELETE
  USING (auth.role() = 'service_role');

-- ── exp_clientes / exp_documentos ─────────────────────────────
DROP POLICY IF EXISTS "Allow all for authenticated" ON exp_clientes;
DROP POLICY IF EXISTS "Allow all for authenticated" ON exp_documentos;

CREATE POLICY "exp_clientes_select" ON exp_clientes FOR SELECT USING (true);
CREATE POLICY "exp_clientes_insert" ON exp_clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "exp_clientes_update" ON exp_clientes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "exp_clientes_delete" ON exp_clientes FOR DELETE
  USING (auth.role() = 'service_role');

CREATE POLICY "exp_documentos_select" ON exp_documentos FOR SELECT USING (true);
CREATE POLICY "exp_documentos_insert" ON exp_documentos FOR INSERT WITH CHECK (true);
CREATE POLICY "exp_documentos_update" ON exp_documentos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "exp_documentos_delete" ON exp_documentos FOR DELETE
  USING (auth.role() = 'service_role');


-- ═══════════════════════════════════════════════════════════════
-- VERIFICACIÓN — Ejecutar después para confirmar cambios
-- ═══════════════════════════════════════════════════════════════
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
-- ═══════════════════════════════════════════════════════════════
