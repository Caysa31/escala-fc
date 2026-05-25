/**
 * POST /api/contrato/fixture
 *
 * Busca o próximo fixture do time na API-Football e salva no contrato (Supabase).
 * Rota server-side — mantém API_FOOTBALL_KEY fora do bundle do cliente.
 *
 * Body: { contratoId: string, teamId: number, leagueId: number }
 * Retorna: { ok: boolean, fixture?: FixtureInfo, motivo?: string }
 */

import { NextResponse } from 'next/server'
import { buscarProximoFixture } from '@/lib/api-football'
import { atualizarFixtureContrato } from '@/lib/supabase'

export async function POST(req: Request) {
  let body: { contratoId?: string; teamId?: number; leagueId?: number }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, motivo: 'Body inválido' }, { status: 400 })
  }

  const { contratoId, teamId, leagueId } = body

  if (!teamId || !leagueId) {
    return NextResponse.json(
      { ok: false, motivo: 'teamId e leagueId são obrigatórios' },
      { status: 400 },
    )
  }

  if (!process.env.API_FOOTBALL_KEY) {
    // Sem chave configurada — ignorar silenciosamente (não quebrar o fluxo)
    return NextResponse.json({ ok: false, motivo: 'API_FOOTBALL_KEY não configurada' })
  }

  try {
    const fixture = await buscarProximoFixture(teamId, leagueId)

    if (!fixture) {
      return NextResponse.json({
        ok: false,
        motivo: 'Nenhum fixture futuro encontrado para este time/liga',
      })
    }

    // Salvar no Supabase se veio com contratoId
    if (contratoId) {
      await atualizarFixtureContrato(
        contratoId,
        fixture.fixtureId,
        fixture.dataJogo,
        fixture.rodadaFutebol,
        teamId,
        leagueId,
      )
    }

    return NextResponse.json({ ok: true, fixture })
  } catch (err) {
    console.error('[/api/contrato/fixture]', err)
    return NextResponse.json({ ok: false, motivo: 'Erro interno' }, { status: 500 })
  }
}
