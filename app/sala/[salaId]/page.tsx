'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Share2, Trophy, Users } from 'lucide-react'
import { Perfil } from '@/lib/types'
import { carregarPerfil, getResultadoRodada } from '@/lib/perfil'
import { getJogadoresDoDia } from '@/lib/game'
import { getModeAtual, getModeConfig, GameMode } from '@/lib/gameMode'
import {
  getLiga, entrarLiga, getPlacarLiga, incrementarPontosLiga, subscribeToLiga,
  LigaInfo, LigaMembro, isSupabaseConfigurado,
} from '@/lib/supabase'
import JogoDesafio from '@/components/JogoDesafio'
import TelaPerfil from '@/components/TelaPerfil'
import BottomNav from '@/components/BottomNav'

function medalha(pos: number): string {
  if (pos === 1) return '🥇'
  if (pos === 2) return '🥈'
  if (pos === 3) return '🥉'
  return `#${pos}`
}

export default function LigaPage() {
  const params = useParams()
  const ligaId = (params.salaId as string).toUpperCase()

  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregado, setCarregado] = useState(false)
  const [liga, setLiga] = useState<LigaInfo | null>(null)
  const [placar, setPlacar] = useState<LigaMembro[]>([])
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [membroAtual, setMembroAtual] = useState<LigaMembro | null>(null)
  const [tela, setTela] = useState<'lobby' | 'dashboard' | 'jogo'>('lobby')
  const [desafioIdx, setDesafioIdx] = useState(0)
  const [mode, setMode] = useState<GameMode>('bola')
  const modeConfig = getModeConfig(mode)
  const jogadoresDoDia = getJogadoresDoDia(mode)

  // Verifica se o user já jogou todos os desafios hoje
  const jogouHoje = jogadoresDoDia.every(
    ({ rodadaId }) => getResultadoRodada(rodadaId) !== null
  )

  // Verifica se já é membro

  const carregarPlacar = useCallback(async () => {
    const dados = await getPlacarLiga(ligaId)
    setPlacar(dados)
    if (perfil) {
      const eu = dados.find(m => m.apelido === perfil.apelido) ?? null
      setMembroAtual(eu)
    }
  }, [ligaId, perfil])

  useEffect(() => {
    async function init() {
      const p = carregarPerfil()
      setPerfil(p)
      setMode(getModeAtual())

      const ligaData = await getLiga(ligaId)
      if (!ligaData) { setErro('Liga não encontrada.'); setCarregado(true); return }
      setLiga(ligaData)

      const dados = await getPlacarLiga(ligaId)
      setPlacar(dados)

      if (p) {
        const eu = dados.find(m => m.apelido === p.apelido) ?? null
        setMembroAtual(eu)
        if (eu) setTela('dashboard') // já é membro → vai direto pro dashboard
      }

      setCarregado(true)
    }
    init()
  }, [ligaId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: atualiza placar quando alguém entra ou joga
  useEffect(() => {
    if (!liga) return
    const unsub = subscribeToLiga(ligaId, carregarPlacar)
    return unsub
  }, [liga, ligaId, carregarPlacar])

  async function handleEntrar() {
    if (!perfil) return
    setEntrando(true)
    const ok = await entrarLiga(ligaId, perfil.apelido, perfil.pontosTotal)
    if (!ok) { setErro('Erro ao entrar na liga. Tente novamente.'); setEntrando(false); return }
    await carregarPlacar()
    setEntrando(false)
    setTela('dashboard')
  }

  async function compartilharLiga() {
    const url = `${window.location.origin}/sala/${ligaId}`
    const texto = `⚔️ ${liga?.nome ?? 'Liga Privada'} — Topa me vencer no COBRA?\nEntre com o código: ${ligaId}\n${url}`
    if (navigator.share) {
      try { await navigator.share({ text: texto }); return } catch { return }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  if (!carregado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#8AB4CC] animate-pulse">Carregando liga...</p>
      </div>
    )
  }

  if (!perfil) return <TelaPerfil onCriar={p => setPerfil(p)} />

  if (erro) {
    return (
      <main className="min-h-screen text-white flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-4xl">⚠️</p>
          <p className="text-white font-bold">{erro}</p>
          <a href="/sala" className="text-[#00C853] text-sm underline">← Voltar</a>
        </div>
      </main>
    )
  }

  if (!liga) return null

  const meuPlacar = membroAtual
  const lider = placar[0]
  const minhaPosicao = placar.findIndex(m => m.apelido === perfil.apelido) + 1

  // ── TELA 3: JOGO ─────────────────────────────────────────────
  if (tela === 'jogo') {
    const { rodadaId, jogador: jogadorAtivo } = jogadoresDoDia[desafioIdx]
    const temProximo = jogadoresDoDia.slice(desafioIdx + 1).some(
      ({ rodadaId: rid }) => getResultadoRodada(rid) === null
    )

    return (
      <main className="min-h-screen text-white">
        <div className="max-w-md mx-auto px-4 pt-5 pb-28 space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setTela('dashboard')}
              className="p-2 rounded-xl bg-[#0F1D30] border border-[#1A3A5C] shrink-0">
              <ArrowLeft size={18} className="text-[#8AB4CC]" />
            </button>
            <div className="flex-1 text-center">
              <p className="text-white font-bold text-sm">{liga.nome}</p>
              <p className="text-[#8AB4CC] text-xs">Desafio {desafioIdx + 1} de {jogadoresDoDia.length}</p>
            </div>
            <div className="w-9 shrink-0" />
          </div>

          <JogoDesafio
            key={rodadaId}
            jogador={jogadorAtivo}
            rodadaId={rodadaId}
            perfil={perfil}
            indiceDesafio={desafioIdx}
            temBottomNav={true}
            totalPistasMax={modeConfig.totalPistas}
            onResultado={p => {
              // Calcula pontos ganhos NESTE desafio e salva na liga
              const pontosGanhos = p.pontosTotal - (perfil?.pontosTotal ?? 0)
              setPerfil(p)
              if (pontosGanhos > 0) {
                void incrementarPontosLiga(ligaId, perfil!.apelido, pontosGanhos)
              }
            }}
            onContratosChange={() => {}}
            // Sem onFimJogo — deixa o JogoDesafio mostrar resultado normalmente
            onProximoDesafio={temProximo ? () => {
              const prox = jogadoresDoDia.findIndex(
                ({ rodadaId: rid }, i) => i > desafioIdx && getResultadoRodada(rid) === null
              )
              if (prox !== -1) setDesafioIdx(prox)
              else setTela('dashboard')
            } : () => {
              // Último desafio — volta ao dashboard
              carregarPlacar()
              setTela('dashboard')
            }}
          />
        </div>
      </main>
    )
  }

  // ── TELA 1: LOBBY (ainda não é membro) ───────────────────────
  if (tela === 'lobby') {
    return (
      <main className="min-h-screen text-white">
        <div className="max-w-md mx-auto px-4 pt-5 pb-28 space-y-5">

          {/* Header */}
          <div className="text-center space-y-1 pt-2">
            <p className="text-[#8AB4CC] text-xs font-semibold uppercase tracking-widest">Liga Privada</p>
            <h1 className="text-3xl font-black">{liga.nome}</h1>
            <p className="text-[#5A8AAA] text-sm">por {liga.criador_apelido}</p>
          </div>

          {/* Placar atual */}
          {placar.length > 0 && (
            <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1A3A5C] flex items-center gap-2">
                <Trophy size={16} className="text-[#FFD23F]" />
                <p className="text-white font-bold text-sm">Quem já está na liga</p>
                <span className="ml-auto text-[#8AB4CC] text-xs">{placar.length} membros</span>
              </div>
              <div className="divide-y divide-[#1A3A5C]">
                {placar.slice(0, 5).map((m, i) => (
                  <div key={m.apelido} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-sm w-6 text-center font-black text-[#FFD23F]">{medalha(i + 1)}</span>
                    <p className="flex-1 text-white text-sm font-semibold truncate">{m.apelido}</p>
                    <p className="text-[#FFD23F] font-black text-sm">{m.pontos_liga ?? 0} pts</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Como funciona */}
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-4 space-y-2">
            <p className="text-white text-sm font-bold">Como funciona</p>
            <div className="space-y-2">
              {[
                { n: '1', t: `Todo dia os mesmos ${modeConfig.totalPistas === 4 ? '4' : '5'} desafios para todos os membros` },
                { n: '2', t: 'Pontos acumulam ao longo de toda a temporada' },
                { n: '3', t: 'Bônus de contrato (Brasileirão, Libertadores, Copa) também valem' },
                { n: '4', t: 'Campeão = quem tiver mais pontos no fim da última rodada' },
              ].map(item => (
                <div key={item.n} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-[#1A3A5C] flex items-center justify-center text-[#8AB4CC] text-[10px] font-bold shrink-0 mt-0.5">
                    {item.n}
                  </div>
                  <p className="text-[#8AB4CC] text-xs leading-snug">{item.t}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Campeonatos */}
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-4 space-y-2">
            <p className="text-[#8AB4CC] text-xs font-bold uppercase tracking-wider">Campeonatos da liga</p>
            {[
              { emoji: '🏆', nome: 'Copa do Brasil', ate: 'Final da temporada 2026' },
              { emoji: '⭐', nome: 'Libertadores', ate: 'Final da temporada 2026' },
              { emoji: '⚽', nome: 'Brasileirão 2026', ate: 'Dezembro 2026' },
            ].map(c => (
              <div key={c.nome} className="flex items-center gap-3">
                <span className="text-lg">{c.emoji}</span>
                <div>
                  <p className="text-white text-xs font-bold">{c.nome}</p>
                  <p className="text-[#5A8AAA] text-[10px]">até {c.ate}</p>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Botão fixo de entrar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#070E1A] border-t border-[#1A3A5C] px-4 pt-3 pb-6">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleEntrar}
              disabled={entrando || !isSupabaseConfigurado()}
              className="w-full bg-[#00C853] hover:bg-[#00E060] disabled:bg-[#1A3A5C] disabled:text-[#8AB4CC] text-[#0A1626] font-black text-xl py-5 rounded-2xl transition-all active:scale-95"
            >
              {entrando ? '⚙️ Entrando...' : '⚔️ Entrar na Liga →'}
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── TELA 2: DASHBOARD (já é membro) ──────────────────────────
  return (
    <main className="min-h-screen text-white">
      <div className="max-w-md mx-auto px-4 pt-5 pb-28 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">{liga.nome}</h1>
            <p className="text-[#8AB4CC] text-xs">por {liga.criador_apelido}</p>
          </div>
          <button onClick={compartilharLiga}
            className="p-2 rounded-xl bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 transition-all">
            <Share2 size={16} className="text-[#8AB4CC]" />
          </button>
        </div>

        {/* Minha posição */}
        {meuPlacar && (
          <div className={`rounded-2xl px-5 py-4 flex items-center justify-between border ${
            jogouHoje
              ? 'bg-[#071A0F] border-[#00C853]/30'
              : 'bg-[#0F1D30] border-[#1A3A5C]'
          }`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${jogouHoje ? 'text-[#00C853]' : 'text-[#8AB4CC]'}`}>
                {jogouHoje ? '✅ Sua rodada de hoje' : '⚽ Rodada de hoje'}
              </p>
              <p className="text-white font-bold text-sm mt-0.5">
                {jogouHoje ? 'Desafios concluídos!' : 'Você ainda não jogou hoje'}
              </p>
              {minhaPosicao > 0 && (
                <p className="text-[#8AB4CC] text-xs mt-0.5">
                  Você está em <span className="text-[#FFD23F] font-black">#{minhaPosicao}</span> na liga
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[#FFD23F] font-black text-2xl">{meuPlacar.pontos_liga ?? 0}</p>
              <p className="text-[#8AB4CC] text-xs">pts na liga</p>
            </div>
          </div>
        )}

        {/* Ranking da liga */}
        <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1A3A5C] flex items-center gap-2">
            <Users size={16} className="text-[#8AB4CC]" />
            <p className="text-white font-bold text-sm">Classificação</p>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[#8AB4CC] text-xs">{placar.length} membros</span>
              <button onClick={carregarPlacar} className="text-[#5A8AAA] text-xs hover:text-[#8AB4CC] transition-colors">↻</button>
            </div>
          </div>

          {placar.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-[#5A8AAA] text-sm">Ninguém jogou ainda</p>
              <p className="text-[#2A4A6A] text-xs mt-1">Seja o primeiro!</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1A3A5C]">
              {placar.map((m, i) => {
                const souEu = m.apelido === perfil.apelido
                return (
                  <div key={m.apelido} className={`flex items-center gap-3 px-4 py-3 ${souEu ? 'bg-[#071A0F]' : ''}`}>
                    <span className={`text-sm w-6 text-center font-black flex-shrink-0 ${
                      i === 0 ? 'text-[#FFD23F] text-base' :
                      i === 1 ? 'text-[#C8C8C8]' :
                      i === 2 ? 'text-[#CD7F32]' : 'text-[#8AB4CC]'
                    }`}>
                      {medalha(i + 1)}
                    </span>
                    <p className={`flex-1 text-sm font-semibold truncate ${souEu ? 'text-[#00C853]' : 'text-white'}`}>
                      {m.apelido} {souEu && <span className="text-[#5A8AAA] text-xs">(você)</span>}
                    </p>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[#FFD23F] font-black text-sm">{m.pontos_liga ?? 0}</p>
                      <p className="text-[#5A8AAA] text-[10px]">pts</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Provocação ao líder */}
          {lider && lider.apelido !== perfil.apelido && (meuPlacar?.pontos_liga ?? 0) < (lider.pontos_liga ?? 0) && (
            <div className="px-4 py-3 border-t border-[#1A3A5C] bg-[#0A1020]">
              <p className="text-[#8AB4CC] text-xs text-center">
                🔥 <span className="text-white font-semibold">{lider.apelido}</span> lidera com{' '}
                <span className="text-[#FFD23F] font-bold">{lider.pontos_liga} pts</span> — você consegue bater?
              </p>
            </div>
          )}
        </div>

        {/* Convidar */}
        <button onClick={compartilharLiga}
          className="w-full flex items-center justify-center gap-2 bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 text-white font-semibold py-3 rounded-xl text-sm transition-all active:scale-95">
          <Share2 size={16} className="text-[#8AB4CC]" />
          Convidar mais amigos · código: <span className="text-[#00C853] font-black">{ligaId}</span>
        </button>

      </div>

      {/* Botão fixo de jogar */}
      <div className="fixed bottom-16 left-0 right-0 z-30 px-4">
        <div className="max-w-md mx-auto">
          {jogouHoje ? (
            <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl px-5 py-4 text-center">
              <p className="text-[#00C853] font-bold text-sm">✅ Você já jogou hoje!</p>
              <p className="text-[#8AB4CC] text-xs mt-0.5">Novos desafios amanhã</p>
            </div>
          ) : (
            <button
              onClick={() => {
                // Começa no primeiro desafio ainda não jogado
                const primeiroNaoJogado = jogadoresDoDia.findIndex(
                  ({ rodadaId }) => getResultadoRodada(rodadaId) === null
                )
                setDesafioIdx(primeiroNaoJogado >= 0 ? primeiroNaoJogado : 0)
                setTela('jogo')
              }}
              className="w-full bg-[#00C853] hover:bg-[#00E060] active:scale-95 text-[#0A1626] font-black text-xl py-5 rounded-2xl transition-all shadow-lg shadow-[#00C853]/20"
            >
              ⚽ Jogar Rodada de Hoje →
            </button>
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  )
}
