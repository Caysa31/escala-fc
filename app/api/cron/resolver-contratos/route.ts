/**
 * GET /api/cron/resolver-contratos
 *
 * Cron job diário (08h UTC via vercel.json).
 * Para cada contrato aguardando_jogo com data_jogo no passado:
 *   1. Verifica se a partida terminou (API-Football)
 *   2. Busca stats do jogador (gols, assists, minutos, rating)
 *   3. Calcula bônus com calcularBonusBase()
 *   4. Resolve o contrato no Supabase
 *
 * Segurança: header Authorization: Bearer {CRON_SECRET}
 */

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { buscarStatusFixture, buscarStatsJogador } from '@/lib/api-football'
import { calcularBonusBase } from '@/lib/contrato'
import { DesempenhoPartida } from '@/lib/types'
import { resolverContratoSupabase } from '@/lib/supabase'

// Linha do log para cada contrato processado
type LogEntry = {
  contrato:   string
  jogador:    string
  resultado:  'resolvido' | 'aguardando' | 'sem_fixture' | 'erro'
  detalhe:    string
  bonus?:     number
}

export async function GET(req: Request) {
  // ── Auth ──────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!supabase) {
    return NextResponse.json({ ok: false, erro: 'Supabase não configurado' })
  }

  if (!process.env.API_FOOTBALL_KEY) {
    return NextResponse.json({ ok: false, erro: 'API_FOOTBALL_KEY não configurada' })
  }

  // ── Buscar contratos pendentes ────────────────────────────
  // Condições: aguardando_jogo + fixture conhecido + data da partida já passou
  const agora = new Date().toISOString()
  const { data: pendentes, error } = await supabase
    .from('contratos')
    .select('*')
    .eq('status', 'aguardando_jogo')
    .not('fixture_id', 'is', null)
    .not('team_id', 'is', null)
    .lt('data_jogo', agora)

  if (error) {
    return NextResponse.json({ ok: false, erro: error.message }, { status: 500 })
  }

  const total = pendentes?.length ?? 0
  const logs: LogEntry[] = []
  let resolvidos = 0

  // ── Processar cada contrato ───────────────────────────────
  for (const c of (pendentes ?? [])) {
    const label = `[${c.nome_jogador} | contrato ${c.id}]`

    try {
      // 1. Verificar se a partida terminou
      const statusFixture = await buscarStatusFixture(c.fixture_id)

      if (!statusFixture) {
        logs.push({ contrato: c.id, jogador: c.nome_jogador, resultado: 'erro', detalhe: 'Fixture não encontrado na API' })
        continue
      }

      if (!statusFixture.terminou) {
        logs.push({ contrato: c.id, jogador: c.nome_jogador, resultado: 'aguardando', detalhe: 'Partida ainda não terminou' })
        continue
      }

      // 2. Buscar stats do jogador
      const stats = await buscarStatsJogador(c.fixture_id, c.team_id, c.nome_jogador)

      const hoje = new Date().toISOString().split('T')[0]

      // 3. Montar DesempenhoPartida
      // Se não achou o jogador na API, assume "não entrou" (bônus = 0, seguro)
      const desempenho: DesempenhoPartida = stats
        ? {
            entrou:            stats.entrou,
            jogou70:           stats.minutos >= 70,
            criouChance:       stats.passesChave >= 1,
            // golOuAssistencia = exatamente 1 contribuição (não os dois)
            golOuAssistencia:  (stats.gols + stats.assistencias) === 1,
            golEAssistencia:   stats.gols >= 1 && stats.assistencias >= 1,
            motm:              stats.rating !== null && stats.rating >= 8.0,
            dataPartida:       hoje,
          }
        : {
            entrou: false, jogou70: false, criouChance: false,
            golOuAssistencia: false, golEAssistencia: false,
            motm: false, dataPartida: hoje,
          }

      // 4. Calcular bônus
      const bonusBase  = calcularBonusBase(desempenho)
      const bonusTotal = Math.round(bonusBase * (c.multiplicador ?? 1))

      // 5. Resolver no Supabase
      await resolverContratoSupabase(c.id, bonusBase, bonusTotal, desempenho)

      resolvidos++
      const detalheStat = stats
        ? `${stats.minutos}min | ${stats.gols}G ${stats.assistencias}A | rating ${stats.rating}`
        : 'jogador não encontrado na API (bônus=0)'

      logs.push({
        contrato: c.id,
        jogador:  c.nome_jogador,
        resultado: 'resolvido',
        detalhe:  detalheStat,
        bonus:    bonusTotal,
      })

      console.log(`${label} ✅ resolvido — bonus ${bonusBase}×${c.multiplicador} = ${bonusTotal}`)

    } catch (err) {
      console.error(`${label} ❌`, err)
      logs.push({
        contrato: c.id,
        jogador:  c.nome_jogador,
        resultado: 'erro',
        detalhe:  String(err),
      })
    }
  }

  // ── Contratos sem fixture ainda (sem data_jogo) ───────────
  // Esses foram assinados mas a API-Football não retornou fixture
  // (pode ser janela entre temporadas ou time sem jogo próximo)
  const { count: semFixture } = await supabase
    .from('contratos')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'aguardando_jogo')
    .is('fixture_id', null)

  return NextResponse.json({
    ok: true,
    resumo: {
      totalPendentes:    total,
      resolvidos,
      semFixtureAinda:   semFixture ?? 0,
      erros:             logs.filter(l => l.resultado === 'erro').length,
      aguardandoPartida: logs.filter(l => l.resultado === 'aguardando').length,
    },
    logs,
    executadoEm: new Date().toISOString(),
  })
}
