'use client'

import { useState, useEffect } from 'react'
import { carregarPerfil } from '@/lib/perfil'
import { getRankingSemanal, getRankingGeral, isSupabaseConfigurado } from '@/lib/supabase'
import { Flame, ArrowLeft, WifiOff } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

interface EntradaRanking {
  id: string
  apelido: string
  pontos_semana?: number
  pontos_total?: number
  streak_atual: number
  taxa_acerto?: number
}

const CACHE_KEY_SEMANAL = 'escalafc_ranking_cache_semanal'
const CACHE_KEY_GERAL   = 'escalafc_ranking_cache_geral'
const CACHE_TS_KEY      = 'escalafc_ranking_cache_ts'

function salvarCache(aba: 'semanal' | 'geral', dados: EntradaRanking[]) {
  try {
    localStorage.setItem(aba === 'semanal' ? CACHE_KEY_SEMANAL : CACHE_KEY_GERAL, JSON.stringify(dados))
    localStorage.setItem(CACHE_TS_KEY, new Date().toISOString())
  } catch {}
}

function lerCache(aba: 'semanal' | 'geral'): EntradaRanking[] {
  try {
    const raw = localStorage.getItem(aba === 'semanal' ? CACHE_KEY_SEMANAL : CACHE_KEY_GERAL)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function lerCacheTs(): string | null {
  try { return localStorage.getItem(CACHE_TS_KEY) } catch { return null }
}

export default function RankingPage() {
  const [aba, setAba] = useState<'semanal' | 'geral'>('semanal')
  const [ranking, setRanking] = useState<EntradaRanking[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroConexao, setErroConexao] = useState(false)
  const [usandoCache, setUsandoCache] = useState(false)
  const [cacheTs, setCacheTs] = useState<string | null>(null)
  const [meuId, setMeuId] = useState<string | null>(null)
  const supabaseOk = isSupabaseConfigurado()

  useEffect(() => {
    const perfil = carregarPerfil()
    if (perfil) {
      const idLocal = localStorage.getItem('escalafc_supabase_id')
      setMeuId(idLocal)
    }
  }, [])

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      setErroConexao(false)
      setUsandoCache(false)

      if (supabaseOk) {
        try {
          const dados = aba === 'semanal'
            ? await getRankingSemanal(100)
            : await getRankingGeral(100)

          if (dados && dados.length > 0) {
            setRanking(dados as EntradaRanking[])
            salvarCache(aba, dados as EntradaRanking[])
            setCacheTs(null)
          } else {
            // Query retornou vazio — tenta cache antes de mostrar vazio
            const cache = lerCache(aba)
            if (cache.length > 0) {
              setRanking(cache)
              setUsandoCache(true)
              setCacheTs(lerCacheTs())
            } else {
              setRanking([])
            }
          }
        } catch {
          // Erro de conexão — usa cache
          const cache = lerCache(aba)
          setRanking(cache)
          setErroConexao(true)
          setUsandoCache(cache.length > 0)
          setCacheTs(lerCacheTs())
        }
      }
      setCarregando(false)
    }
    carregar()
  }, [aba, supabaseOk])

  const minhaPosicao = meuId ? ranking.findIndex(r => r.id === meuId) + 1 : null

  return (
    <main className="min-h-screen text-white">
      <div className="max-w-md mx-auto px-4 pt-5 pb-28 space-y-4">

        {/* Header */}
        <header className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 transition-all shrink-0">
            <ArrowLeft size={18} className="text-[#8AB4CC]" />
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-black">🌍 Ranking Global</h1>
            <p className="text-[#8AB4CC] text-xs mt-0.5">Todos os jogadores do COBRA</p>
          </div>
          <div className="w-9 shrink-0" />
        </header>

        {/* Abas */}
        <div className="flex bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-1 gap-1">
          {(['semanal', 'geral'] as const).map(a => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all
                ${aba === a
                  ? 'bg-[#00C853] text-[#0A1626]'
                  : 'text-[#8AB4CC] hover:text-white'
                }`}
            >
              {a === 'semanal' ? '🗓️ Semana' : '🏆 Geral'}
            </button>
          ))}
        </div>

        {/* Minha posição */}
        {minhaPosicao && minhaPosicao > 0 && (
          <div className="bg-gradient-to-r from-[#071A0F] to-[#0A1626] border border-[#00C853]/30 rounded-xl px-4 py-3 text-center">
            <p className="text-[#4A9A6A] text-sm">
              Você está em <span className="font-black text-xl text-[#00C853]">#{minhaPosicao}</span>{' '}
              de {ranking.length} jogadores
            </p>
          </div>
        )}

        {/* Sem Supabase */}
        {!supabaseOk && (
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-6 text-center space-y-3">
            <p className="text-3xl">🔌</p>
            <p className="text-white font-bold">Ranking offline</p>
            <p className="text-[#8AB4CC] text-sm">
              Configure o Supabase no <code className="text-[#00C853]">.env.local</code> para ativar o ranking global.
            </p>
          </div>
        )}

        {/* Banner de erro de conexão */}
        {erroConexao && (
          <div className="flex items-center gap-3 bg-orange-950/40 border border-orange-900/40 rounded-xl px-4 py-3">
            <WifiOff size={16} className="text-orange-400 shrink-0" />
            <div>
              <p className="text-orange-300 text-sm font-semibold">Ranking temporariamente indisponível</p>
              <p className="text-orange-400/70 text-xs">Problema de conexão com o servidor</p>
            </div>
          </div>
        )}

        {/* Banner de cache */}
        {usandoCache && !erroConexao && cacheTs && (
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl px-4 py-2 text-center">
            <p className="text-[#5A8AAA] text-xs">
              Exibindo último ranking salvo · {new Date(cacheTs).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}

        {/* Lista */}
        {supabaseOk && (
          <div className="space-y-2">
            {carregando ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-[#0F1D30] rounded-xl h-14 animate-pulse" />
              ))
            ) : ranking.length === 0 && !erroConexao ? (
              <div className="text-center py-10 text-[#8AB4CC]">
                <p className="text-3xl mb-2">🏆</p>
                <p>Ninguém no ranking ainda</p>
                <p className="text-xs mt-1">Jogue hoje para aparecer aqui!</p>
              </div>
            ) : ranking.length === 0 && erroConexao ? null : (
              ranking.map((entrada, i) => {
                const pos = i + 1
                const sou = entrada.id === meuId
                const pontos = aba === 'semanal' ? entrada.pontos_semana : entrada.pontos_total
                const medalha = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : null

                return (
                  <div
                    key={entrada.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
                      ${sou
                        ? 'bg-[#071A0F] border-[#00C853]/40'
                        : 'bg-[#0F1D30] border-[#1A3A5C]'
                      }`}
                  >
                    {/* Posição */}
                    <div className={`w-8 text-center font-black text-sm flex-shrink-0
                      ${pos === 1 ? 'text-[#FFD23F]' : pos === 2 ? 'text-[#C8C8C8]' : pos === 3 ? 'text-[#CD7F32]' : 'text-[#8AB4CC]'}`}>
                      {medalha ?? `#${pos}`}
                    </div>

                    {/* Nome */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${sou ? 'text-[#00C853]' : 'text-white'}`}>
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
                      <p className="font-black text-[#FFD23F] text-sm">{pontos ?? 0}</p>
                      <p className="text-[#5A8AAA] text-xs">pts</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  )
}
