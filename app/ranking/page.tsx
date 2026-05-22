'use client'

import { useState, useEffect } from 'react'
import { carregarPerfil } from '@/lib/perfil'
import { getRankingSemanal, getRankingGeral, isSupabaseConfigurado } from '@/lib/supabase'
import { Flame, Trophy, ArrowLeft, Globe } from 'lucide-react'
import Link from 'next/link'

interface EntradaRanking {
  id: string
  apelido: string
  pontos_semana?: number
  pontos_total?: number
  streak_atual: number
  taxa_acerto?: number
}

export default function RankingPage() {
  const [aba, setAba] = useState<'semanal' | 'geral'>('semanal')
  const [ranking, setRanking] = useState<EntradaRanking[]>([])
  const [carregando, setCarregando] = useState(true)
  const [meuId, setMeuId] = useState<string | null>(null)
  const supabaseOk = isSupabaseConfigurado()

  useEffect(() => {
    // Tentar pegar o ID do usuário local (se sincronizado com Supabase)
    const perfil = carregarPerfil()
    if (perfil) {
      const idLocal = localStorage.getItem('escalafc_supabase_id')
      setMeuId(idLocal)
    }
  }, [])

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      if (supabaseOk) {
        const dados = aba === 'semanal'
          ? await getRankingSemanal(100)
          : await getRankingGeral(100)
        setRanking(dados as EntradaRanking[])
      }
      setCarregando(false)
    }
    carregar()
  }, [aba, supabaseOk])

  const minhaPosicao = meuId ? ranking.findIndex(r => r.id === meuId) + 1 : null

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <header className="flex items-center gap-3">
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <Globe size={20} className="text-green-400" />
              Ranking Global
            </h1>
            <p className="text-zinc-500 text-xs">Todos os jogadores do ESCALA FC</p>
          </div>
        </header>

        {/* Abas */}
        <div className="flex bg-zinc-800 rounded-xl p-1 gap-1">
          {(['semanal', 'geral'] as const).map(a => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all
                ${aba === a ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              {a === 'semanal' ? '🗓️ Semana' : '🏆 Geral'}
            </button>
          ))}
        </div>

        {/* Minha posição */}
        {minhaPosicao && minhaPosicao > 0 && (
          <div className="bg-green-950 border border-green-800 rounded-xl px-4 py-3 text-center">
            <p className="text-green-300 text-sm">
              Você está em <span className="font-black text-lg">#{minhaPosicao}</span>{' '}
              de {ranking.length} jogadores
            </p>
          </div>
        )}

        {/* Sem Supabase */}
        {!supabaseOk && (
          <div className="bg-zinc-800 border border-zinc-600 rounded-xl p-6 text-center space-y-3">
            <p className="text-3xl">🔌</p>
            <p className="text-white font-bold">Ranking offline</p>
            <p className="text-zinc-400 text-sm">
              Configure o Supabase no <code className="text-green-400">.env.local</code> para
              ativar o ranking global entre todos os jogadores.
            </p>
            <p className="text-zinc-500 text-xs">
              Veja o arquivo <code>.env.local.example</code> na pasta do projeto.
            </p>
          </div>
        )}

        {/* Lista */}
        {supabaseOk && (
          <div className="space-y-2">
            {carregando ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-zinc-800 rounded-xl h-14 animate-pulse" />
              ))
            ) : ranking.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">
                <p className="text-3xl mb-2">🏆</p>
                <p>Ninguém no ranking ainda</p>
                <p className="text-xs mt-1">Jogue hoje para aparecer aqui!</p>
              </div>
            ) : (
              ranking.map((entrada, i) => {
                const pos = i + 1
                const sou = entrada.id === meuId
                const pontos = aba === 'semanal' ? entrada.pontos_semana : entrada.pontos_total

                return (
                  <div
                    key={entrada.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                      ${sou ? 'bg-green-950 border border-green-700' : 'bg-zinc-800'}`}
                  >
                    {/* Posição */}
                    <div className={`w-8 text-center font-black text-sm flex-shrink-0
                      ${pos === 1 ? 'text-yellow-400' : pos === 2 ? 'text-zinc-300' : pos === 3 ? 'text-orange-400' : 'text-zinc-500'}`}>
                      {pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `#${pos}`}
                    </div>

                    {/* Nome */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${sou ? 'text-green-300' : 'text-white'}`}>
                        {entrada.apelido} {sou && '(você)'}
                      </p>
                    </div>

                    {/* Streak */}
                    {entrada.streak_atual > 0 && (
                      <div className="flex items-center gap-1 text-xs text-orange-400">
                        <Flame size={12} />
                        <span>{entrada.streak_atual}</span>
                      </div>
                    )}

                    {/* Pontos */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-white text-sm">{pontos ?? 0}</p>
                      <p className="text-zinc-500 text-xs">pts</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </main>
  )
}
