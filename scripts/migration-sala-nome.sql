-- ============================================================
-- ESCALA FC — Adiciona nome à tabela salas
-- Execute no Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Colar → Run
-- ============================================================

ALTER TABLE salas ADD COLUMN IF NOT EXISTS nome TEXT;
