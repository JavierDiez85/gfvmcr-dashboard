-- Expedientes de Clientes — Supabase Schema
-- Ejecutar en SQL Editor de Supabase

-- 1. Tabla de clientes
CREATE TABLE IF NOT EXISTS exp_clientes (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo_persona    TEXT NOT NULL DEFAULT 'fisica' CHECK (tipo_persona IN ('fisica','moral')),
  nombre_completo TEXT,
  razon_social    TEXT,
  representante_legal TEXT,
  persona_contacto TEXT,
  correo          TEXT,
  telefono        TEXT,
  rfc             TEXT,
  direccion       TEXT,
  productos       JSONB DEFAULT '[]'::jsonb,
  notas           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de documentos
CREATE TABLE IF NOT EXISTS exp_documentos (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cliente_id      BIGINT NOT NULL REFERENCES exp_clientes(id) ON DELETE CASCADE,
  categoria       TEXT NOT NULL,
  nombre_archivo  TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  tamano          BIGINT DEFAULT 0,
  mime_type       TEXT,
  notas           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exp_docs_cliente ON exp_documentos(cliente_id);

-- 3. Storage bucket (crear desde Dashboard de Supabase > Storage > New Bucket)
-- Nombre: expedientes
-- Public: false
-- File size limit: 50MB
-- Allowed MIME types: application/pdf, image/png, image/jpeg, image/jpg

-- 4. RLS policies
ALTER TABLE exp_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exp_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON exp_clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON exp_documentos FOR ALL USING (true) WITH CHECK (true);

-- 5. Storage policy (ejecutar en SQL Editor)
-- INSERT policy
CREATE POLICY "Allow upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'expedientes');
-- SELECT policy
CREATE POLICY "Allow read" ON storage.objects FOR SELECT USING (bucket_id = 'expedientes');
-- DELETE policy
CREATE POLICY "Allow delete" ON storage.objects FOR DELETE USING (bucket_id = 'expedientes');
