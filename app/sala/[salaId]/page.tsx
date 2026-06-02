'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Share2, Clock } from 'lucide-react'
import { Perfil, Jogador } from '@/lib/types'
import { carregarPerfil } from '@/lib/perfil'
import {
  getSala, salvarResultadoSala, getResultadosSala,
  subscribeToSala, SalaResultado, isSupabaseConfigurado,
} from '@/lib/supabase'
import jogadoresData from '@/data/jogadores.json'
import JogoDesafio from '@/components/JogoDesafio'
import TelaPerfil from '@/components/TelaPerfil'

const todosJogadores = jogadoresData as Jogador[]

type Aba = 'jogar' | 'placar'

function medalha(pos: number): string {
  if (pos === 1) return '🥇'
  if (pos === 2) return '🥈'
  if (pos === 3) return '🥉'
  return `#${pos}`
}

export default function SalaJogoPage() {
  const params = useParams()
  const salaId = (params.salaId as string).toUpperCase()

  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregado, setCarregado] = useState(false)
  const [sala, setSala] = useState<{ id: string; jogador_id: number; criador_apelido: string; expira_em: string; nome: string | null } | null>(null)
  const [entrou, setEntrou] = useState(false)
  const [jogador, setJogador] = useState<Jogador | null>(null)
  const [resultados, setResultados] = useState<SalaResultado[]>([])
  const [aba, setAba] = useState<Aba>('jogar')
  const [jaJogou, setJaJogou] = useState(false)
  const [erro, setErro] = useState('')
  const [expirou, setExpirou] = useState(false)

  // Ordena resultados: mais pontos primeiro, desempate por pista (menor = melhor)
  const resultadosOrdenados = [...resultados].sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos
    const pa = a.pista_acerto ?? 99
    const pb = b.pista_acerto ?? 99
    return pa - pb
  })

  const meuApelido = perfil?.apelido ?? ''

  const carregarResultados = useCallback(async () => {
    const res = await getResultadosSala(salaId)
    setResultados(res)
    if (perfil && res.some(r => r.apelido === perfil.apelido)) {
      setJaJogou(true)
    }
  }, [salaId, perfil])

  useEffect(() => {
    const p = carregarPerfil()
    setPerfil(p)

    async function init() {
      const s = await getSala(salaId)
      if (!s) { setErro('Sala não encontrada.'); setCarregado(true); return }

      setExpirou(new Date(s.expira_em) < new Date())
      setSala(s)

      const jog = todosJogadores.find(j => j.id === s.jogador_id) ?? null
      setJogador(jog)
      setCarregado(true)
    }

    void init()
  }, [salaId])

  useEffect(() => {
    if (!carregado || !sala) return
    void carregarResultados()
  }, [carregado, sala, carregarResultados])

  // Subscrição realtime — atualiza placar ao vivo
  useEffect(() => {
    if (!sala || !isSupabaseConfigurado()) return
    const unsubscribe = subscribeToSala(salaId, (novoResultado) => {
      setResultados(prev => {
        // Substitui se já existir esse apelido (upsert local)
        const idx = prev.findIndex(r => r.apelido === novoResultado.apelido)
        if (idx >= 0) {
          const novo = [...prev]
          novo[idx] = novoResultado
          return novo
        }
        return [...prev, novoResultado]
      })
    })
    return unsubscribe
  }, [sala, salaId])

  // Callback quando jogo termina — salva resultado na sala
  const handleFimJogo = useCallback(async (resultado: {
    ganhou: boolean; pontos: number; pistaAcerto: number | null
  }) => {
    if (!perfil || jaJogou) return
    await salvarResultadoSala({
      salaId,
      apelido: perfil.apelido,
      pontos: resultado.pontos,
      pistaAcerto: resultado.pistaAcerto,
    })
    setJaJogou(true)
    // Muda para o placar após breve delay
    setTimeout(() => setAba('placar'), 800)
  }, [perfil, jaJogou, salaId])

  async function compartilharWhatsApp() {
    const url = `${window.location.origin}/sala/${salaId}`
    const nomeLiga = sala?.nome ?? `Sala ${salaId}`
    const texto = `🏆 ${nomeLiga} — Topa me vencer no ESCALA FC?\nAdivinhe o mesmo jogador e veja quem acerta com menos pistas!\n${url}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ text: texto }); return } catch { return }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  // Tempo restante da sala
  const tempoRestante = sala ? Math.max(0, new Date(sala.expira_em).getTime() - Date.now()) : 0
  const horasRestantes = Math.floor(tempoRestante / (1000 * 60 * 60))
  const minutosRestantes = Math.floor((tempoRestante % (1000 * 60 * 60)) / (1000 * 60))

  // ── Loading ──────────────────────────────────────────────────
  if (!carregado) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 animate-pulse text-lg">⚔️ Carregando sala...</div>
      </div>
    )
  }

  // ── Precisa criar perfil ─────────────────────────────────────
  if (!perfil) {
    return <TelaPerfil onCriar={p => setPerfil(p)} />
  }

  // ── Erro ─────────────────────────────────────────────────────
  if (erro || !sala || !jogador) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={18} /> Voltar ao início
          </Link>
          <div className="bg-red-950 border border-red-900 rounded-xl p-6 text-center space-y-2">
            <p className="text-3xl">❌</p>
            <p className="text-white font-bold">{erro || 'Sala não encontrada'}</p>
            <p className="text-zinc-400 text-sm">Verifique o código e tente novamente.</p>
          </div>
        </div>
      </main>
    )
  }

  // ── Lobby — boas-vindas antes do jogo ───────────────────────
  if (!entrou && sala && !expirou) {
    const nomeLiga = sala.nome ?? `Sala ${salaId}`
    const lider = resultadosOrdenados[0]

    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-md mx-auto px-4 py-8 space-y-5 pb-32">

          {/* ── Hero ── */}
          <div className="relative bg-gradient-to-b from-purple-950 to-zinc-950 border border-purple-800 rounded-3xl px-6 pt-8 pb-6 text-center overflow-hidden">
            {/* Brilho decorativo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="text-6xl">🏆</div>
              <div>
                <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-1">Liga Privada</p>
                <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{nomeLiga}</h1>
              </div>
              <p className="text-zinc-400 text-sm">
                Criada por <span className="text-purple-300 font-semibold">{sala.criador_apelido}</span>
              </p>
              {/* Timer */}
              <div className="inline-flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-700 rounded-full px-3 py-1.5">
                <Clock size={12} className="text-zinc-500" />
                <span className="text-zinc-400 text-xs font-semibold">
                  {horasRestantes}h{minutosRestantes.toString().padStart(2,'0')}m restantes
                </span>
              </div>
            </div>
          </div>

          {/* ── Quem já está ── */}
          {resultados.length > 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <p className="text-white font-bold text-sm">Quem já jogou</p>
                <span className="bg-purple-800 text-purple-200 text-xs font-bold px-2 py-0.5 rounded-full">
                  {resultados.length} {resultados.length === 1 ? 'jogador' : 'jogadores'}
                </span>
              </div>
              <div className="divide-y divide-zinc-800">
                {resultadosOrdenados.slice(0, 5).map((r, i) => (
                  <div key={r.apelido} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-base w-6 text-center flex-shrink-0">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                    </span>
                    <p className="flex-1 text-sm font-semibold text-white truncate">{r.apelido}</p>
                    <div className="text-right flex-shrink-0">
                      <p className="text-yellow-400 font-black text-sm">{r.pontos > 0 ? `+${r.pontos}` : '0'} pts</p>
                      <p className="text-zinc-600 text-xs">{r.pista_acerto ? `pista ${r.pista_acerto}` : 'errou'}</p>
                    </div>
                  </div>
                ))}
              </div>
              {lider && (
                <div className="px-4 py-3 bg-purple-950/50 border-t border-purple-900">
                  <p className="text-purple-300 text-xs text-center">
                    🔥 <span className="font-bold">{lider.apelido}</span> lidera com <span className="font-black text-yellow-400">{lider.pontos} pts</span> — você consegue bater?
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-5 text-center space-y-1">
              <p className="text-2xl">👀</p>
              <p className="text-white font-bold text-sm">Ninguém jogou ainda</p>
              <p className="text-zinc-500 text-xs">Você pode ser o primeiro!</p>
            </div>
          )}

          {/* ── Como jogar ── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <p className="text-white font-bold text-sm">Como jogar</p>
            <div className="space-y-3">
              {[
                { n: '1', icon: '✨', titulo: 'Leia o histórico', desc: 'Cada partida começa com uma narrativa sobre o jogador. Tente adivinhar só com ela.' },
                { n: '2', icon: '🔒', titulo: 'Revele as pistas', desc: 'Se errar, a próxima pista é liberada — mas custa pontos.' },
                { n: '3', icon: '🎯', titulo: 'Acerte com menos pistas', desc: 'Quanto antes acertar, mais pontos você ganha para a liga.' },
              ].map(s => (
                <div key={s.n} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-900 border border-purple-700 flex items-center justify-center text-purple-300 font-black text-sm flex-shrink-0">
                    {s.n}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{s.icon} {s.titulo}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tabela de pontos ── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <p className="text-white font-bold text-sm">Como conquistar pontos</p>
            <div className="grid grid-cols-5 gap-2">
              {[
                { pista: 'Histórico', pts: 100, cor: 'text-yellow-400', bg: 'bg-yellow-950 border-yellow-800' },
                { pista: 'Pista 1', pts: 80, cor: 'text-green-400', bg: 'bg-green-950 border-green-800' },
                { pista: 'Pista 2', pts: 60, cor: 'text-green-400', bg: 'bg-green-950 border-green-900' },
                { pista: 'Pista 3', pts: 40, cor: 'text-orange-400', bg: 'bg-orange-950 border-orange-900' },
                { pista: 'Pista 4', pts: 20, cor: 'text-red-400', bg: 'bg-red-950 border-red-900' },
              ].map(p => (
                <div key={p.pista} className={`border rounded-xl p-2 text-center ${p.bg}`}>
                  <p className={`font-black text-base leading-none ${p.cor}`}>{p.pts}</p>
                  <p className="text-zinc-500 text-xs mt-1 leading-tight">{p.pista}</p>
                </div>
              ))}
            </div>
            <p className="text-zinc-600 text-xs text-center">
              Errar não zera — você avança para a próxima pista
            </p>
          </div>

          {/* ── Campeonato ── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-white font-bold text-sm">O Campeonato da Liga</p>
              <p className="text-zinc-500 text-xs mt-1">A liga dura enquanto durar o futebol brasileiro</p>
            </div>
            <div className="space-y-2">
              {[
                { comp: 'Brasileirão', emoji: '🇧🇷', status: 'Em andamento', ate: 'Dezembro 2025', cor: 'text-green-400' },
                { comp: 'Copa do Brasil', emoji: '🏆', status: 'Em andamento', ate: 'Novembro 2025', cor: 'text-green-400' },
                { comp: 'Libertadores', emoji: '⭐', status: 'Em andamento', ate: 'Novembro 2025', cor: 'text-green-400' },
              ].map(c => (
                <div key={c.comp} className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3">
                  <span className="text-xl flex-shrink-0">{c.emoji}</span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{c.comp}</p>
                    <p className={`text-xs font-medium ${c.cor}`}>{c.status}</p>
                  </div>
                  <p className="text-zinc-500 text-xs flex-shrink-0">até {c.ate}</p>
                </div>
              ))}
            </div>
            <div className="bg-purple-950 border border-purple-900 rounded-xl px-4 py-3">
              <p className="text-purple-300 text-xs text-center leading-relaxed">
                🏆 O campeão da liga é quem tiver <span className="text-white font-bold">mais pontos acumulados</span> ao final da última rodada do Brasileirão
              </p>
            </div>
          </div>

          {/* ── Jogando como ── */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-zinc-400 text-sm">Entrando como</p>
            <p className="text-white font-bold">{perfil?.apelido}</p>
          </div>

        </div>

        {/* ── Botão fixo no rodapé ── */}
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 px-4 pt-3 pb-6">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setEntrou(true)}
              className="w-full bg-purple-700 hover:bg-purple-600 active:scale-95 text-white font-black text-xl py-5 rounded-2xl transition-all shadow-lg shadow-purple-900/40"
            >
              Entrar na Liga →
            </button>
          </div>
        </div>

      </main>
    )
  }

  // ── Sala expirada ────────────────────────────────────────────
  if (expirou) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl bg-zinc-800"><ArrowLeft size={18} className="text-zinc-400" /></Link>
            <h1 className="text-xl font-black text-zinc-400">Sala {salaId} — Expirada</h1>
          </div>
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 text-center space-y-3">
            <p className="text-3xl">⏱️</p>
            <p className="text-white font-bold">Esta sala expirou</p>
            <p className="text-zinc-400 text-sm">Salas duram 6 horas. Peça ao criador para abrir uma nova.</p>
          </div>
          {/* Mostra placar final mesmo com sala expirada */}
          {resultadosOrdenados.length > 0 && (
            <PlacardSala resultados={resultadosOrdenados} meuApelido={meuApelido} />
          )}
        </div>
      </main>
    )
  }

  // Rodada ID único para esta sala (evita conflito com desafios diários)
  const rodadaIdSala = 2_000_000 + parseInt(salaId.replace(/[^0-9]/g, '0').slice(0, 6), 10)

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-all">
              <ArrowLeft size={18} className="text-zinc-400" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-purple-300">🏆 {sala.nome ?? salaId}</h1>
              <p className="text-zinc-500 text-xs">Sala de {sala.criador_apelido}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Tempo restante */}
            <div className="flex items-center gap-1 bg-zinc-800 rounded-lg px-2 py-1">
              <Clock size={12} className="text-zinc-500" />
              <span className="text-zinc-400 text-xs">{horasRestantes}h{minutosRestantes.toString().padStart(2,'0')}m</span>
            </div>
            <button
              onClick={compartilharWhatsApp}
              className="p-2 rounded-xl bg-green-800 hover:bg-green-700 transition-all"
            >
              <Share2 size={16} className="text-green-300" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setAba('jogar')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              aba === 'jogar' ? 'bg-purple-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            ⚽ Jogar
          </button>
          <button
            onClick={() => setAba('placar')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all relative ${
              aba === 'placar' ? 'bg-purple-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Trophy size={14} className="inline mr-1" />
            Placar
            {resultados.length > 0 && (
              <span className="absolute top-1 right-2 bg-purple-500 text-white text-xs font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {resultados.length}
              </span>
            )}
          </button>
        </div>

        {/* Aba Jogar */}
        {aba === 'jogar' && (
          <>
            {jaJogou ? (
              <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 text-center space-y-3">
                <p className="text-3xl">✅</p>
                <p className="text-white font-bold">Você já jogou nesta sala!</p>
                <p className="text-zinc-400 text-sm">Confira o placar — mais pessoas podem ainda estar jogando.</p>
                <button
                  onClick={() => setAba('placar')}
                  className="w-full bg-purple-700 hover:bg-purple-600 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Ver placar ao vivo →
                </button>
              </div>
            ) : (
              <JogoDesafio
                key={rodadaIdSala}
                jogador={jogador}
                rodadaId={rodadaIdSala}
                perfil={perfil}
                indiceDesafio={0}
                modoExtra={true}
                labelProximoDesafio="Ver placar →"
                mensagemFimJogo="Confira o placar! 👇"
                onResultado={p => setPerfil(p)}
                onContratosChange={() => {}}
                onProximoDesafio={() => setAba('placar')}
                onFimJogo={handleFimJogo}
              />
            )}
          </>
        )}

        {/* Aba Placar */}
        {aba === 'placar' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-zinc-400 text-sm">
                {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'} • atualiza ao vivo
              </p>
              <button
                onClick={compartilharWhatsApp}
                className="text-green-400 text-xs font-semibold"
              >
                Convidar mais →
              </button>
            </div>

            <PlacardSala resultados={resultadosOrdenados} meuApelido={meuApelido} />

            {resultados.length === 0 && (
              <div className="text-center py-10 text-zinc-500">
                <p className="text-3xl mb-2">⏳</p>
                <p>Ainda ninguém terminou</p>
                <p className="text-xs mt-1">Compartilhe a sala para chamar mais amigos!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

// ── Componente de placar ──────────────────────────────────────

function PlacardSala({
  resultados,
  meuApelido,
}: {
  resultados: SalaResultado[]
  meuApelido: string
}) {
  if (resultados.length === 0) return null

  return (
    <div className="space-y-2">
      {resultados.map((r, i) => {
        const pos = i + 1
        const souEu = r.apelido === meuApelido
        const acertou = r.pista_acerto !== null
        return (
          <div
            key={r.apelido}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
              souEu
                ? 'bg-purple-950 border border-purple-700'
                : 'bg-zinc-800'
            }`}
          >
            <div className={`w-9 text-center font-black text-sm flex-shrink-0 ${
              pos === 1 ? 'text-yellow-400 text-lg' :
              pos === 2 ? 'text-zinc-300 text-base' :
              pos === 3 ? 'text-orange-400 text-base' :
              'text-zinc-500 text-sm'
            }`}>
              {medalha(pos)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm truncate ${souEu ? 'text-purple-300' : 'text-white'}`}>
                {r.apelido} {souEu && <span className="text-purple-400 text-xs">(você)</span>}
              </p>
              <p className="text-zinc-500 text-xs">
                {acertou ? `Acertou na pista ${r.pista_acerto}` : 'Não acertou'}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`font-black text-base ${r.pontos > 0 ? 'text-yellow-400' : 'text-zinc-500'}`}>
                {r.pontos > 0 ? `+${r.pontos}` : '0'}
              </p>
              <p className="text-zinc-600 text-xs">pts</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
