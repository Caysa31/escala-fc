-- ============================================================
-- ESCALA FC — Push Notifications: Tokens FCM
-- Execute no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS notif_tokens (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id    TEXT,                          -- supabase_id do usuário (opcional)
  apelido       TEXT,                          -- fallback se não tiver usuario_id
  fcm_token     TEXT NOT NULL UNIQUE,
  ultima_rodada TEXT,                          -- última data que jogou (para filtrar lembrete)
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notif_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_tokens_read"   ON notif_tokens FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "notif_tokens_insert" ON notif_tokens FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "notif_tokens_update" ON notif_tokens FOR UPDATE TO anon, authenticated USING (true);
