-- ============================================================
-- COBRA — Liga Privada permanente (substitui salas temporárias)
-- Execute no Supabase SQL Editor
-- ============================================================

-- Tabela principal da liga (sem expira_em — dura até fim do campeonato)
CREATE TABLE IF NOT EXISTS ligas (
  id            TEXT PRIMARY KEY,          -- código de 6 chars ex: "BRAVOS"
  nome          TEXT NOT NULL,             -- "Liga dos Brabos"
  criador_apelido TEXT NOT NULL,
  criada_em     TIMESTAMPTZ DEFAULT NOW(),
  ativa         BOOLEAN DEFAULT TRUE       -- false = encerrada ao fim do campeonato
);

-- Membros da liga com baseline de pontos ao entrar
CREATE TABLE IF NOT EXISTS liga_membros (
  id            BIGSERIAL PRIMARY KEY,
  liga_id       TEXT NOT NULL REFERENCES ligas(id),
  apelido       TEXT NOT NULL,
  user_id       TEXT,                      -- supabase_id do usuário (pode ser null se offline)
  pontos_base   INT NOT NULL DEFAULT 0,    -- pontos_total no momento que entrou
  pontos_liga   INT NOT NULL DEFAULT 0,    -- pontos acumulados dentro da liga (incrementados a cada desafio)
  joined_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(liga_id, apelido)                 -- um apelido só pode entrar uma vez por liga
);

-- Política de UPDATE para pontos_liga (necessária para incrementarPontosLiga)
CREATE POLICY "liga_membros_update" ON liga_membros FOR UPDATE WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_liga_membros_liga_id ON liga_membros(liga_id);
CREATE INDEX IF NOT EXISTS idx_liga_membros_user_id ON liga_membros(user_id);

-- Row Level Security (leitura pública, escrita autenticada)
ALTER TABLE ligas ENABLE ROW LEVEL SECURITY;
ALTER TABLE liga_membros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ligas_select" ON ligas FOR SELECT USING (true);
CREATE POLICY "ligas_insert" ON ligas FOR INSERT WITH CHECK (true);

CREATE POLICY "liga_membros_select" ON liga_membros FOR SELECT USING (true);
CREATE POLICY "liga_membros_insert" ON liga_membros FOR INSERT WITH CHECK (true);
