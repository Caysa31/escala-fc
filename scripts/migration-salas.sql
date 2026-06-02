-- ============================================================
-- ESCALA FC — Multiplayer: Salas Privadas
-- Execute este script no Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Colar → Run
-- ============================================================

-- Tabela de salas temporárias
CREATE TABLE IF NOT EXISTS salas (
  id           TEXT PRIMARY KEY,             -- e.g., 'KR47X2'
  jogador_id   INTEGER NOT NULL,
  criador_apelido TEXT NOT NULL,
  criado_em    TIMESTAMPTZ DEFAULT NOW(),
  expira_em    TIMESTAMPTZ NOT NULL          -- criado_em + 6 horas
);

-- Resultados de cada participante por sala
CREATE TABLE IF NOT EXISTS sala_resultados (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sala_id      TEXT NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  apelido      TEXT NOT NULL,
  pontos       INTEGER NOT NULL DEFAULT 0,
  pista_acerto INTEGER,                      -- null = não acertou
  concluido_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sala_id, apelido)                   -- cada apelido envia uma vez por sala
);

-- Row Level Security — acesso público (sem login necessário)
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sala_resultados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salas_read"   ON salas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "salas_insert" ON salas FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "sala_resultados_read"   ON sala_resultados FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sala_resultados_insert" ON sala_resultados FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Habilitar Realtime para atualização do placar ao vivo
ALTER PUBLICATION supabase_realtime ADD TABLE sala_resultados;
