-- ESCALA FC — Schema do Supabase
-- Execute este arquivo no SQL Editor do Supabase (supabase.com → seu projeto → SQL Editor)

-- ── Usuários ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  apelido     TEXT NOT NULL,
  codigo      TEXT NOT NULL UNIQUE,  -- FC-xxxxx
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Resultados por rodada ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS resultados (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id    UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  rodada_id     INTEGER NOT NULL,
  jogador_id    INTEGER NOT NULL,
  pista_acerto  INTEGER,            -- NULL = não acertou
  pontos        INTEGER DEFAULT 0,
  tentativas    JSONB NOT NULL DEFAULT '[]',
  jogado_em     DATE NOT NULL DEFAULT CURRENT_DATE,

  UNIQUE(usuario_id, rodada_id)
);

-- ── Streaks ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS streaks (
  usuario_id      UUID REFERENCES usuarios(id) ON DELETE CASCADE PRIMARY KEY,
  streak_atual    INTEGER DEFAULT 0,
  streak_maximo   INTEGER DEFAULT 0,
  ultima_rodada   DATE,
  pontos_total    INTEGER DEFAULT 0,
  rodadas_jogadas INTEGER DEFAULT 0,
  rodadas_acertadas INTEGER DEFAULT 0
);

-- ── Grupos (torneio local) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS grupos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        TEXT NOT NULL,
  codigo      TEXT NOT NULL UNIQUE,  -- ex: TRAM-2026
  criado_por  UUID REFERENCES usuarios(id),
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grupo_membros (
  grupo_id    UUID REFERENCES grupos(id) ON DELETE CASCADE,
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  entrou_em   TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (grupo_id, usuario_id)
);

-- ── Contratos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contratos (
  id              TEXT PRIMARY KEY,   -- "{rodadaId}-{jogadorId}"
  usuario_id      UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  rodada_id       INTEGER NOT NULL,
  jogador_id      INTEGER NOT NULL,
  nome_jogador    TEXT NOT NULL,
  bandeira        TEXT NOT NULL,
  clube           TEXT NOT NULL,
  multiplicador   NUMERIC NOT NULL,
  pista_acerto    INTEGER NOT NULL,
  data_assinatura DATE DEFAULT CURRENT_DATE,
  status          TEXT DEFAULT 'aguardando_jogo',  -- aguardando_jogo | trivia_pendente | trivia_resolvida | resolvido
  bonus_base      INTEGER DEFAULT 0,
  bonus_total     INTEGER DEFAULT 0,
  desempenho      JSONB,
  -- fixture (preenchido após assinatura via API-Football)
  fixture_id      INTEGER,
  data_jogo       DATE,
  rodada_futebol  TEXT,
  team_id         INTEGER,
  league_id       INTEGER,
  -- timestamp de resolução
  resolvido_em    TIMESTAMPTZ,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Índices para performance ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_resultados_rodada ON resultados(rodada_id);
CREATE INDEX IF NOT EXISTS idx_resultados_usuario ON resultados(usuario_id);
CREATE INDEX IF NOT EXISTS idx_resultados_pontos ON resultados(pontos DESC);
CREATE INDEX IF NOT EXISTS idx_streaks_pontos ON streaks(pontos_total DESC);

-- ── Ranking global (view) ─────────────────────────────────────
-- Ranking da semana atual
-- Fonte: tabela resultados (desafio diário apenas — modos não gravam aqui)
--        + bônus de contratos resolvidos nesta semana
CREATE OR REPLACE VIEW ranking_semanal AS
SELECT
  u.id,
  u.apelido,
  s.streak_atual,
  COALESCE(SUM(r.pontos), 0)
    + COALESCE((
        SELECT SUM(c.bonus_total)
        FROM contratos c
        WHERE c.usuario_id = u.id
          AND c.status IN ('resolvido', 'trivia_resolvida')
          AND DATE_TRUNC('week', c.resolvido_em) = DATE_TRUNC('week', NOW())
      ), 0) AS pontos_semana,
  COUNT(r.id) AS jogos_semana
FROM usuarios u
JOIN streaks s ON s.usuario_id = u.id
LEFT JOIN resultados r ON r.usuario_id = u.id
  AND DATE_TRUNC('week', r.jogado_em::TIMESTAMPTZ) = DATE_TRUNC('week', NOW())
GROUP BY u.id, u.apelido, s.streak_atual
ORDER BY pontos_semana DESC;

-- Ranking geral (all time)
-- Fonte: tabela resultados (desafio diário) + contratos resolvidos
-- NÃO usa streaks.pontos_total para evitar dessincronia com o ranking semanal.
-- Modos extras não gravam em resultados, portanto não entram no ranking.
CREATE OR REPLACE VIEW ranking_geral AS
SELECT
  u.id,
  u.apelido,
  s.streak_atual,
  s.streak_maximo,
  COALESCE((
    SELECT SUM(r.pontos) FROM resultados r WHERE r.usuario_id = u.id
  ), 0)
  + COALESCE((
    SELECT SUM(c.bonus_total) FROM contratos c
    WHERE c.usuario_id = u.id
      AND c.status IN ('resolvido', 'trivia_resolvida')
  ), 0) AS pontos_total,
  s.rodadas_jogadas,
  s.rodadas_acertadas,
  CASE WHEN s.rodadas_jogadas > 0
    THEN ROUND((s.rodadas_acertadas::NUMERIC / s.rodadas_jogadas) * 100)
    ELSE 0
  END AS taxa_acerto
FROM usuarios u
JOIN streaks s ON s.usuario_id = u.id
ORDER BY pontos_total DESC;

-- ── Row Level Security (RLS) ──────────────────────────────────
ALTER TABLE usuarios       ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados     ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_membros  ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos      ENABLE ROW LEVEL SECURITY;

-- Leitura pública para rankings
CREATE POLICY "Ranking público" ON usuarios      FOR SELECT USING (true);
CREATE POLICY "Ranking público" ON streaks       FOR SELECT USING (true);
CREATE POLICY "Ranking público" ON resultados    FOR SELECT USING (true);
CREATE POLICY "Grupos públicos" ON grupos        FOR SELECT USING (true);
CREATE POLICY "Membros públicos" ON grupo_membros FOR SELECT USING (true);

-- Escrita livre via anon key (sem auth — identificação por código)
CREATE POLICY "Insert livre" ON usuarios      FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert livre" ON resultados    FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert livre" ON streaks       FOR INSERT WITH CHECK (true);
CREATE POLICY "Upsert livre" ON streaks       FOR UPDATE WITH CHECK (true);
CREATE POLICY "Insert livre" ON grupos        FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert livre" ON grupo_membros FOR INSERT WITH CHECK (true);
CREATE POLICY "Select livre" ON contratos     FOR SELECT USING (true);
CREATE POLICY "Insert livre" ON contratos     FOR INSERT WITH CHECK (true);
CREATE POLICY "Update livre" ON contratos     FOR UPDATE WITH CHECK (true);
