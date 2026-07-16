-- ============================================================
-- FlashLi Patrocínios — Setup Multi-Projeto
-- Cola no SQL Editor do Supabase e clica RUN
-- ============================================================

-- 1. TABELA DE PROJETOS
CREATE TABLE IF NOT EXISTS projetos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,                        -- "DWCup 2026 Dublin"
  evento text NOT NULL,                      -- "DWCup"
  ano integer NOT NULL,                      -- 2026
  cidade text NOT NULL,                      -- "Dublin"
  pais text NOT NULL,                        -- "Irlanda"
  bandeira text DEFAULT '🇮🇪',              -- emoji da bandeira
  meta_objetivo numeric DEFAULT 3000,
  atletas text DEFAULT 'Matilde Mota',      -- nomes separados por vírgula
  escola text DEFAULT 'Flash Li Dance School',
  gestor text DEFAULT 'Hugo',               -- quem envia emails
  gestor_email text,                         -- email de contacto público
  gestor_whatsapp text DEFAULT '+351 924 368 517',
  dossier_url text,                          -- URL do PDF do dossier
  url_base text DEFAULT 'https://flash-li-patrocinios.vercel.app',
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE projetos DISABLE ROW LEVEL SECURITY;

-- 2. TABELA DE PATROCINADORES (com projeto_id)
CREATE TABLE IF NOT EXISTS patrocinadores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id uuid REFERENCES projetos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text,
  telefone text,
  idioma text DEFAULT 'PT',
  status text DEFAULT 'Pendente',
  valor numeric DEFAULT 0,
  notas text DEFAULT '',
  recibo_enviado boolean DEFAULT false,
  logo_recebido boolean DEFAULT false,
  redes_sociais boolean DEFAULT false,
  data_followup date,
  proposta_enviada_em timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE patrocinadores DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_patrocinadores_projeto ON patrocinadores(projeto_id);

-- 3. TABELA DE HISTÓRICO DE CAMPANHAS (com projeto_id)
CREATE TABLE IF NOT EXISTS historico_novidades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id uuid REFERENCES projetos(id) ON DELETE CASCADE,
  assunto text,
  mensagem text,
  foto_url text,
  video_url text,
  tipo_campanha text DEFAULT 'novidade',
  num_fotos integer DEFAULT 0,
  num_videos integer DEFAULT 0,
  num_links_rs integer DEFAULT 0,
  total_destinatarios integer DEFAULT 0,
  total_enviados integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE historico_novidades DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_historico_projeto ON historico_novidades(projeto_id);

-- 4. PROJETO INICIAL: DWCup 2026 Dublin (migração dos dados existentes)
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
)
ON CONFLICT DO NOTHING;

-- 5. MIGRAR PATROCINADORES EXISTENTES para o projeto DWCup 2026
-- (corre só se já tinhas dados sem projeto_id)
DO $$
DECLARE v_projeto_id uuid;
BEGIN
  SELECT id INTO v_projeto_id FROM projetos WHERE nome = 'DWCup 2026 Dublin' LIMIT 1;
  IF v_projeto_id IS NOT NULL THEN
    UPDATE patrocinadores SET projeto_id = v_projeto_id WHERE projeto_id IS NULL;
    UPDATE historico_novidades SET projeto_id = v_projeto_id WHERE projeto_id IS NULL;
  END IF;
END $$;
