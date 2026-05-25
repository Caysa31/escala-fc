// Cron job: resolve contratos pendentes após as partidas acontecerem
// Agendado via vercel.json — roda diariamente às 8h UTC
//
// Etapa 1: estrutura básica + filtro de contratos pendentes
// Etapa 4: integração real com API-Football para calcular bônus

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  // Vercel Cron envia o header Authorization com o CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!supabase) {
    return NextResponse.json({ ok: false, erro: 'Supabase não configurado' })
  }

  // Buscar contratos aguardando jogo com data_jogo já passada
  const agora = new Date().toISOString()
  const { data: pendentes, error } = await supabase
    .from('contratos')
    .select('*')
    .eq('status', 'aguardando_jogo')
    .not('fixture_id', 'is', null)
    .lt('data_jogo', agora)

  if (error) {
    return NextResponse.json({ ok: false, erro: error.message }, { status: 500 })
  }

  const total = pendentes?.length ?? 0

  // TODO (Etapa 4): Para cada contrato pendente:
  // 1. Buscar fixture na API-Football → GET /fixtures?id={fixture_id}
  // 2. Verificar se a partida terminou (fixture.status.short === 'FT')
  // 3. Buscar estatísticas do jogador → GET /fixtures/players?fixture={id}&team={teamId}
  // 4. Calcular bonusBase com calcularBonusBase(desempenho)
  // 5. Atualizar contrato no Supabase com status 'resolvido' + bonus_total
  // 6. Creditar pontos no perfil do usuário

  return NextResponse.json({
    ok: true,
    pendentes: total,
    mensagem: total === 0
      ? 'Nenhum contrato pendente para resolver'
      : `${total} contratos pendentes — integração API-Football na Etapa 4`,
  })
}
