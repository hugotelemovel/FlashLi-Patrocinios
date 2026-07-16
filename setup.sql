-- ============================================================
-- FlashLi Patrocínios — Setup Multi-Projeto (versão segura)
-- Cola no SQL Editor do Supabase e clica RUN
-- ============================================================

-- 1. TABELA DE PROJETOS
CREATE TABLE IF NOT EXISTS projetos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  evento text NOT NULL DEFAULT '',
  ano integer NOT NULL DEFAULT 2026,
  cidade text NOT NULL DEFAULT '',
  pais text DEFAULT '',
  bandeira text DEFAULT '🏳️',
  meta_objetivo numeric DEFAULT 3000,
  atletas text DEFAULT '',
  escola text DEFAULT 'Flash Li Dance School',
  gestor text DEFAULT 'Hugo',
  gestor_email text,
  gestor_whatsapp text DEFAULT '+351 924 368 517',
  dossier_url text,
  url_base text DEFAULT 'https://flash-li-patrocinios.vercel.app',
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE projetos DISABLE ROW LEVEL SECURITY;

-- 2. ADICIONAR projeto_id às tabelas existentes (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patrocinadores' AND column_name = 'projeto_id'
  ) THEN
    ALTER TABLE patrocinadores ADD COLUMN projeto_id uuid REFERENCES projetos(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'historico_novidades' AND column_name = 'projeto_id'
  ) THEN
    ALTER TABLE historico_novidades ADD COLUMN projeto_id uuid REFERENCES projetos(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. ADICIONAR colunas em falta à tabela patrocinadores (se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patrocinadores' AND column_name='telefone') THEN
    ALTER TABLE patrocinadores ADD COLUMN telefone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patrocinadores' AND column_name='notas') THEN
    ALTER TABLE patrocinadores ADD COLUMN notas text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patrocinadores' AND column_name='redes_sociais') THEN
    ALTER TABLE patrocinadores ADD COLUMN redes_sociais boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patrocinadores' AND column_name='logo_recebido') THEN
    ALTER TABLE patrocinadores ADD COLUMN logo_recebido boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patrocinadores' AND column_name='data_followup') THEN
    ALTER TABLE patrocinadores ADD COLUMN data_followup date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patrocinadores' AND column_name='idioma') THEN
    ALTER TABLE patrocinadores ADD COLUMN idioma text DEFAULT 'PT';
  END IF;
END $$;

-- 4. ADICIONAR colunas em falta à tabela historico_novidades (se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='historico_novidades' AND column_name='tipo_campanha') THEN
    ALTER TABLE historico_novidades ADD COLUMN tipo_campanha text DEFAULT 'novidade';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='historico_novidades' AND column_name='num_fotos') THEN
    ALTER TABLE historico_novidades ADD COLUMN num_fotos integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='historico_novidades' AND column_name='num_videos') THEN
    ALTER TABLE historico_novidades ADD COLUMN num_videos integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='historico_novidades' AND column_name='num_links_rs') THEN
    ALTER TABLE historico_novidades ADD COLUMN num_links_rs integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='historico_novidades' AND column_name='total_enviados') THEN
    ALTER TABLE historico_novidades ADD COLUMN total_enviados integer DEFAULT 0;
  END IF;
END $$;

-- 5. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_patrocinadores_projeto ON patrocinadores(projeto_id);
CREATE INDEX IF NOT EXISTS idx_historico_projeto ON historico_novidades(projeto_id);

-- 6. CRIAR PROJETO INICIAL: DWCup 2026 Dublin
INSERT INTO projetos (nome, evento, ano, cidade, pais, bandeira, meta_objetivo, atletas, escola, gestor, gestor_whatsapp, dossier_url, url_base)
VALUES (
  'DWCup 2026 Dublin',
  'DWCup',
  2026,
  'Dublin',
  'Irlanda',
  '🇮🇪',
  3000,
  'Matilde Mota',
  'Flash Li Dance School',
  'Hugo',
  '+351 924 368 517',
  'https://flash-li-patrocinios.vercel.app/Dossier_Matilde_Mota.pdf',
  'https://flash-li-patrocinios.vercel.app'
);

-- 7. MIGRAR DADOS EXISTENTES para o projeto criado
DO $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM projetos WHERE nome = 'DWCup 2026 Dublin' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE patrocinadores SET projeto_id = v_id WHERE projeto_id IS NULL;
    UPDATE historico_novidades SET projeto_id = v_id WHERE projeto_id IS NULL;
  END IF;
END $$;
