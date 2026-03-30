-- COPIA ISTO PARA O SQL EDITOR DO SUPABASE E CLICA "RUN"

CREATE TABLE IF NOT EXISTS patrocinadores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  email text NOT NULL,
  idioma text DEFAULT 'PT',
  status text DEFAULT 'Pendente',
  valor numeric DEFAULT 0,
  recibo_enviado boolean DEFAULT false,
  logo_recebido boolean DEFAULT false,
  proposta_enviada_em timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- ESTA LINHA É A MAGIA QUE DESATIVA O RLS E PERMITE À TUA APP ADICIONAR DADOS:
ALTER TABLE patrocinadores DISABLE ROW LEVEL SECURITY;
