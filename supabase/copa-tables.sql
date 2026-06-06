-- ============================================================
-- COBRA DA COPA — Tabelas Supabase
-- Rodar no Supabase SQL Editor: supabase.com → projeto → SQL Editor
-- ============================================================

-- Copa Streaks (pontuação e sequências)
CREATE TABLE IF NOT EXISTS copa_streaks (
  id TEXT PRIMARY KEY,
  apelido TEXT NOT NULL,
  codigo TEXT NOT NULL,
  pontos_total INT NOT NULL DEFAULT 0,
  streak_atual INT NOT NULL DEFAULT 0,
  streak_maximo INT NOT NULL DEFAULT 0,
  ultimo_jogo DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE copa_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "copa_streaks_all" ON copa_streaks FOR ALL USING (true) WITH CHECK (true);

-- Copa Resultados (histórico de jogadas)
CREATE TABLE IF NOT EXISTS copa_resultados (
  id BIGSERIAL PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  rodada_id INT NOT NULL,
  jogador_id INT NOT NULL,
  pista_acerto INT,
  pontos INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, rodada_id)
);
ALTER TABLE copa_resultados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "copa_resultados_all" ON copa_resultados FOR ALL USING (true) WITH CHECK (true);

-- Copa Ranking Semanal
CREATE TABLE IF NOT EXISTS copa_ranking_semanal (
  id TEXT PRIMARY KEY,
  apelido TEXT NOT NULL,
  pontos_semana INT NOT NULL DEFAULT 0,
  semana TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE copa_ranking_semanal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "copa_ranking_semanal_all" ON copa_ranking_semanal FOR ALL USING (true) WITH CHECK (true);

-- Copa Ranking Geral
CREATE TABLE IF NOT EXISTS copa_ranking_geral (
  id TEXT PRIMARY KEY,
  apelido TEXT NOT NULL,
  pontos_total INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE copa_ranking_geral ENABLE ROW LEVEL SECURITY;
CREATE POLICY "copa_ranking_geral_all" ON copa_ranking_geral FOR ALL USING (true) WITH CHECK (true);

-- Copa Ligas Privadas
CREATE TABLE IF NOT EXISTS copa_ligas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  criador_apelido TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE copa_ligas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "copa_ligas_all" ON copa_ligas FOR ALL USING (true) WITH CHECK (true);

-- Copa Membros das Ligas
CREATE TABLE IF NOT EXISTS copa_liga_membros (
  id BIGSERIAL PRIMARY KEY,
  liga_id TEXT NOT NULL REFERENCES copa_ligas(id),
  apelido TEXT NOT NULL,
  user_id TEXT,
  pontos_base INT NOT NULL DEFAULT 0,
  pontos_liga INT NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(liga_id, apelido)
);
ALTER TABLE copa_liga_membros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "copa_liga_membros_all" ON copa_liga_membros FOR ALL USING (true) WITH CHECK (true);

-- Copa Contratos
CREATE TABLE IF NOT EXISTS copa_contratos (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  jogador_id INT NOT NULL,
  rodada_id INT NOT NULL,
  multiplicador NUMERIC NOT NULL DEFAULT 1.1,
  fixture_id INT,
  data_jogo DATE,
  rodada_futebol TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  bonus_pts INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE copa_contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "copa_contratos_all" ON copa_contratos FOR ALL USING (true) WITH CHECK (true);
