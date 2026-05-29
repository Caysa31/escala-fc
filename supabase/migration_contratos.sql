-- MIGRAÇÃO: Corrige tabela contratos
-- Execute no SQL Editor do Supabase: supabase.com → seu projeto → SQL Editor
-- É seguro rodar mesmo se já existir (IF NOT EXISTS / IF EXISTS em tudo)

-- 1. Criar a tabela se ainda não existir (completa, com todas as colunas)
CREATE TABLE IF NOT EXISTS contratos (
  id              TEXT PRIMARY KEY,
  usuario_id      UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  rodada_id       INTEGER NOT NULL,
  jogador_id      INTEGER NOT NULL,
  nome_jogador    TEXT NOT NULL,
  bandeira        TEXT NOT NULL,
  clube           TEXT NOT NULL,
  multiplicador   NUMERIC NOT NULL,
  pista_acerto    INTEGER NOT NULL,
  data_assinatura DATE DEFAULT CURRENT_DATE,
  status          TEXT DEFAULT 'aguardando_jogo',
  bonus_base      INTEGER DEFAULT 0,
  bonus_total     INTEGER DEFAULT 0,
  desempenho      JSONB,
  fixture_id      INTEGER,
  data_jogo       DATE,
  rodada_futebol  TEXT,
  team_id         INTEGER,
  league_id       INTEGER,
  resolvido_em    TIMESTAMPTZ,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adicionar colunas que podem estar faltando (seguro se já existirem)
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS fixture_id     INTEGER;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS data_jogo      DATE;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS rodada_futebol TEXT;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS team_id        INTEGER;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS league_id      INTEGER;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS resolvido_em   TIMESTAMPTZ;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS criado_em      TIMESTAMPTZ DEFAULT NOW();

-- 3. Ativar RLS (seguro se já estiver ativo)
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas (drop antes para evitar conflito de nomes)
DROP POLICY IF EXISTS "Select livre" ON contratos;
DROP POLICY IF EXISTS "Insert livre" ON contratos;
DROP POLICY IF EXISTS "Update livre" ON contratos;

CREATE POLICY "Select livre" ON contratos FOR SELECT USING (true);
CREATE POLICY "Insert livre" ON contratos FOR INSERT WITH CHECK (true);
CREATE POLICY "Update livre" ON contratos FOR UPDATE WITH CHECK (true);

-- 5. Índices úteis
CREATE INDEX IF NOT EXISTS idx_contratos_usuario  ON contratos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_contratos_rodada   ON contratos(rodada_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status   ON contratos(status);
