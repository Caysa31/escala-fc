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
  const [jogando, setJogando] = useState(false)
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
    // Volta para a página da liga após breve delay
    setTimeout(() => setJogando(false), 800)
  }, [perfil, jaJogou, salaId])

  async function compartilharWhatsApp() {
    const url = `${window.location.origin}/sala/${salaId}`
    const nomeLiga = sala?.nome ?? `Sala ${salaId}`
    const texto = `🏆 ${nomeLiga} — Topa me vencer no COBRA?\nAdivinhe o mesmo jogador e veja quem acerta com menos pistas!\n${url}`
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
      <div className="min-h-screen bg-[#0A1626] flex items-center justify-center">
        <div className="text-[#8AB4CC] animate-pulse text-lg">⚔️ Carregando sala...</div>
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
      <main className="min-h-screen bg-[#0A1626] text-white">
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-[#8AB4CC] hover:text-white transition-colors">
            <ArrowLeft size={18} /> Voltar ao início
          </Link>
          <div className="bg-red-950 border border-red-900 rounded-xl p-6 text-center space-y-2">
            <p className="text-3xl">❌</p>
            <p className="text-white font-bold">{erro || 'Sala não encontrada'}</p>
            <p className="text-[#8AB4CC] text-sm">Verifique o código e tente novamente.</p>
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
      <main className="min-h-screen bg-[#0A1626] text-white">
        <div className="max-w-md mx-auto px-4 py-8 space-y-5 pb-32">

          {/* ── Hero ── */}
          <div className="relative bg-gradient-to-b from-[#0A1626] to-[#0F1D30] border border-[#1A3A5C] rounded-3xl px-6 pt-8 pb-6 text-center overflow-hidden">
            {/* Brilho decorativo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#00C853]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="text-6xl">🏆</div>
              <div>
                <p className="text-[#8AB4CC] text-xs font-bold uppercase tracking-widest mb-1">Liga Privada</p>
                <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{nomeLiga}</h1>
              </div>
              <p className="text-[#8AB4CC] text-sm">
                Criada por <span className="text-[#00C853] font-semibold">{sala.criador_apelido}</span>
              </p>
              {/* Timer */}
              <div className="inline-flex items-center gap-1.5 bg-[#0F1D30]/80 border border-[#1A3A5C] rounded-full px-3 py-1.5">
                <Clock size={12} className="text-[#8AB4CC]" />
                <span className="text-[#8AB4CC] text-xs font-semibold">
                  {horasRestantes}h{minutosRestantes.toString().padStart(2,'0')}m restantes
                </span>
              </div>
            </div>
          </div>

          {/* ── Quem já está ── */}
          {resultados.length > 0 ? (
            <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1A3A5C] flex items-center justify-between">
                <p className="text-white font-bold text-sm">Quem já jogou</p>
                <span className="bg-[#1A3A5C] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {resultados.length} {resultados.length === 1 ? 'jogador' : 'jogadores'}
                </span>
              </div>
              <div className="divide-y divide-[#1A3A5C]">
                {resultadosOrdenados.slice(0, 5).map((r, i) => (
                  <div key={r.apelido} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-base w-6 text-center flex-shrink-0">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                    </span>
                    <p className="flex-1 text-sm font-semibold text-white truncate">{r.apelido}</p>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[#FFD23F] font-black text-sm">{r.pontos > 0 ? `+${r.pontos}` : '0'} pts</p>
                      <p className="text-[#5A8AAA] text-xs">{r.pista_acerto ? `pista ${r.pista_acerto}` : 'errou'}</p>
                    </div>
                  </div>
                ))}
              </div>
              {lider && (
                <div className="px-4 py-3 bg-[#0F1D30] border-t border-[#1A3A5C]">
                  <p className="text-[#00C853] text-xs text-center">
                    🔥 <span className="font-bold">{lider.apelido}</span> lidera com <span className="font-black text-[#FFD23F]">{lider.pontos} pts</span> — você consegue bater?
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl px-5 py-5 text-center space-y-1">
              <p className="text-2xl">👀</p>
              <p className="text-white font-bold text-sm">Ninguém jogou ainda</p>
              <p className="text-[#8AB4CC] text-xs">Você pode ser o primeiro!</p>
            </div>
          )}

          {/* ── Como jogar ── */}
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl p-5 space-y-4">
            <p className="text-white font-bold text-sm">Como jogar</p>
            <div className="space-y-3">
              {[
                { n: '1', icon: '✨', titulo: 'Leia o histórico', desc: 'Cada partida começa com uma narrativa sobre o jogador. Tente adivinhar só com ela.' },
                { n: '2', icon: '🔒', titulo: 'Revele as pistas', desc: 'Se errar, a próxima pista é liberada — mas custa pontos.' },
                { n: '3', icon: '🎯', titulo: 'Acerte com menos pistas', desc: 'Quanto antes acertar, mais pontos você ganha para a liga.' },
              ].map(s => (
                <div key={s.n} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1A3A5C] border border-[#1A3A5C] flex items-center justify-center text-[#00C853] font-black text-sm flex-shrink-0">
                    {s.n}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{s.icon} {s.titulo}</p>
                    <p className="text-[#8AB4CC] text-xs mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tabela de pontos ── */}
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl p-5 space-y-3">
            <p className="text-white font-bold text-sm">Como conquistar pontos</p>
            <div className="grid grid-cols-5 gap-2">
              {[
                { pista: 'Histórico', pts: 100, cor: 'text-[#FFD23F]', bg: 'bg-[#0F1D30] border-[#FFD23F]/30' },
                { pista: 'Pista 1', pts: 80, cor: 'text-[#00C853]', bg: 'bg-[#071A0F] border-[#00C853]/30' },
                { pista: 'Pista 2', pts: 60, cor: 'text-[#00C853]', bg: 'bg-[#071A0F] border-green-900' },
                { pista: 'Pista 3', pts: 40, cor: 'text-[#FFD23F]', bg: 'bg-[#0F1D30] border-[#FFD23F]/20' },
                { pista: 'Pista 4', pts: 20, cor: 'text-red-400', bg: 'bg-red-950 border-red-900' },
              ].map(p => (
                <div key={p.pista} className={`border rounded-xl p-2 text-center ${p.bg}`}>
                  <p className={`font-black text-base leading-none ${p.cor}`}>{p.pts}</p>
                  <p className="text-[#8AB4CC] text-xs mt-1 leading-tight">{p.pista}</p>
                </div>
              ))}
            </div>
            <p className="text-[#5A8AAA] text-xs text-center">
              Errar não zera — você avança para a próxima pista
            </p>
          </div>

          {/* ── Bônus de Contrato ── */}
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-white font-bold text-sm">⚡ Bônus de Contrato</p>
              <p className="text-[#8AB4CC] text-xs mt-1">Após acertar, você assina um contrato com o jogador — e ganha bônus pelo desempenho dele na próxima partida real</p>
            </div>
            <div className="space-y-2">
              {[
                { acao: 'Entrou em campo',       pts: '+10',  cor: 'text-white' },
                { acao: 'Jogou 70+ minutos',     pts: '+20',  cor: 'text-white' },
                { acao: 'Criou chance de gol',   pts: '+30',  cor: 'text-[#4A9A6A]' },
                { acao: 'Gol ou assistência',    pts: '+50',  cor: 'text-[#00C853]' },
                { acao: 'Gol E assistência',     pts: '+80',  cor: 'text-[#FFD23F]' },
                { acao: 'Man of the Match',      pts: '+100', cor: 'text-[#FFD23F]' },
              ].map(r => (
                <div key={r.acao} className="flex items-center justify-between bg-[#0F1D30] rounded-lg px-3 py-2">
                  <p className="text-[#8AB4CC] text-xs">{r.acao}</p>
                  <p className={`font-black text-sm ${r.cor}`}>{r.pts} pts</p>
                </div>
              ))}
            </div>
            <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-3 space-y-2">
              <p className="text-[#8AB4CC] text-xs font-bold uppercase tracking-wider">Multiplicador pelo momento do acerto</p>
              <div className="grid grid-cols-5 gap-1 text-center">
                {[
                  { label: 'Histórico', mult: '×3.0', cor: 'text-[#FFD23F]' },
                  { label: 'Pista 1',   mult: '×3.0', cor: 'text-[#FFD23F]' },
                  { label: 'Pista 2',   mult: '×2.5', cor: 'text-[#00C853]' },
                  { label: 'Pista 3',   mult: '×2.0', cor: 'text-[#00C853]' },
                  { label: 'Pista 4+',  mult: '×1.1', cor: 'text-[#8AB4CC]' },
                ].map(m => (
                  <div key={m.label} className="bg-[#0F1D30] rounded-lg py-2 px-1">
                    <p className={`font-black text-sm ${m.cor}`}>{m.mult}</p>
                    <p className="text-[#5A8AAA] text-xs mt-0.5 leading-tight">{m.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[#5A8AAA] text-xs text-center">
                Acertar cedo + Man of the Match = até <span className="text-[#FFD23F] font-bold">+300 pts</span> de bônus!
              </p>
            </div>
          </div>

          {/* ── Campeonato ── */}
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-white font-bold text-sm">🗓️ Duração do Campeonato</p>
              <p className="text-[#8AB4CC] text-xs mt-1">
                A liga fica aberta enquanto os campeonatos estiverem rolando — e só encerra com a última rodada do <span className="text-white font-semibold">Brasileirão</span>
              </p>
            </div>
            <div className="space-y-2">
              {[
                { comp: 'Libertadores',  emoji: '⭐', ate: 'Novembro 2025', cor: 'text-[#FFD23F]' },
                { comp: 'Copa do Brasil', emoji: '🏆', ate: 'Novembro 2025', cor: 'text-[#00C853]' },
                { comp: 'Brasileirão',   emoji: '🇧🇷', ate: 'Dezembro 2025 — encerramento da liga', cor: 'text-[#8AB4CC]' },
              ].map(c => (
                <div key={c.comp} className="flex items-center gap-3 bg-[#0F1D30] rounded-xl px-4 py-3">
                  <span className="text-xl flex-shrink-0">{c.emoji}</span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{c.comp}</p>
                    <p className={`text-xs font-medium ${c.cor}`}>{c.ate}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-r from-[#0A1626] to-[#0F1D30] border border-[#1A3A5C] rounded-xl px-4 py-4 space-y-1 text-center">
              <p className="text-2xl">👑</p>
              <p className="text-white font-black text-base">Quem vence a liga?</p>
              <p className="text-[#8AB4CC] text-sm leading-relaxed">
                O jogador com <span className="text-[#FFD23F] font-bold">mais pontos acumulados</span> ao final da última rodada do Brasileirão é o campeão — somando pontos do jogo <span className="text-white font-semibold">e</span> bônus de contrato.
              </p>
            </div>
          </div>

          {/* ── Jogando como ── */}
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-[#8AB4CC] text-sm">Entrando como</p>
            <p className="text-white font-bold">{perfil?.apelido}</p>
          </div>

        </div>

        {/* ── Botão fixo no rodapé ── */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#070E1A]/95 backdrop-blur border-t border-[#1A3A5C] px-4 pt-3 pb-6">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setEntrou(true)}
              className="w-full bg-[#00C853] hover:bg-[#00E060] active:scale-95 text-[#0A1626] font-black text-xl py-5 rounded-2xl transition-all shadow-lg shadow-[#00C853]/20"
            >
              Entrar na Liga →
            </button>
          </div>
        </div>

      </main>
    )
  }

  // ── Página da Liga (dashboard entre lobby e jogo) ────────────
  if (entrou && !jogando && sala && !expirou) {
    const nomeLiga = sala.nome ?? `Sala ${salaId}`
    const meuResultado = resultados.find(r => r.apelido === perfil?.apelido)
    const lider = resultadosOrdenados[0]

    return (
      <main className="min-h-screen bg-[#0A1626] text-white">
        <div className="max-w-md mx-auto px-4 py-6 space-y-4 pb-32">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEntrou(false)}
                className="p-2 rounded-xl bg-[#0F1D30] hover:bg-[#1A3A5C] transition-all"
              >
                <ArrowLeft size={18} className="text-[#8AB4CC]" />
              </button>
              <div>
                <h1 className="text-lg font-black text-[#00C853]">🏆 {nomeLiga}</h1>
                <p className="text-[#8AB4CC] text-xs">por {sala.criador_apelido} · {horasRestantes}h{minutosRestantes.toString().padStart(2,'0')}m</p>
              </div>
            </div>
            <button onClick={compartilharWhatsApp} className="p-2 rounded-xl bg-[#071A0F] hover:bg-[#0A2A1A] transition-all">
              <Share2 size={16} className="text-[#4A9A6A]" />
            </button>
          </div>

          {/* Seu resultado do dia */}
          {meuResultado ? (
            <div className="bg-[#071A0F] border border-[#00C853]/30 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[#00C853] text-xs font-semibold uppercase tracking-wide">Sua rodada de hoje</p>
                <p className="text-white font-bold text-sm mt-0.5">
                  {meuResultado.pista_acerto ? `✅ Acertou na pista ${meuResultado.pista_acerto}` : '❌ Não acertou hoje'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[#FFD23F] font-black text-2xl">{meuResultado.pontos > 0 ? `+${meuResultado.pontos}` : '0'}</p>
                <p className="text-[#8AB4CC] text-xs">pts hoje</p>
              </div>
            </div>
          ) : (
            <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[#00C853] text-xs font-semibold uppercase tracking-wide">Rodada de hoje</p>
                <p className="text-white font-bold text-sm mt-0.5">Você ainda não jogou</p>
                {resultados.length > 0 && (
                  <p className="text-[#8AB4CC] text-xs mt-0.5">
                    {resultados.length} {resultados.length === 1 ? 'membro jogou' : 'membros jogaram'}
                  </p>
                )}
              </div>
              <div className="text-4xl">⚽</div>
            </div>
          )}

          {/* Placar da Liga */}
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A3A5C] flex items-center justify-between">
              <p className="text-white font-bold text-sm">Placar da Liga</p>
              <span className="text-[#8AB4CC] text-xs">atualiza ao vivo</span>
            </div>

            {resultadosOrdenados.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[#5A8AAA] text-sm">Ninguém jogou ainda hoje</p>
                <p className="text-[#5A8AAA] text-xs mt-1">Seja o primeiro!</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1A3A5C]">
                {resultadosOrdenados.map((r, i) => {
                  const souEu = r.apelido === perfil?.apelido
                  const pos = i + 1
                  return (
                    <div key={r.apelido} className={`flex items-center gap-3 px-4 py-3 ${souEu ? 'bg-[#0F1D30]' : ''}`}>
                      <span className="w-7 text-center text-base flex-shrink-0">
                        {pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : <span className="text-[#5A8AAA] text-sm font-bold">#{pos}</span>}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${souEu ? 'text-[#00C853]' : 'text-white'}`}>
                          {r.apelido} {souEu && <span className="text-[#8AB4CC] text-xs">(você)</span>}
                        </p>
                        <p className="text-[#5A8AAA] text-xs">
                          {r.pista_acerto ? `acertou na pista ${r.pista_acerto}` : 'não acertou'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-black text-sm ${r.pontos > 0 ? 'text-[#FFD23F]' : 'text-[#5A8AAA]'}`}>
                          {r.pontos > 0 ? `+${r.pontos}` : '0'} pts
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {lider && lider.apelido !== perfil?.apelido && (
              <div className="px-4 py-3 border-t border-[#1A3A5C] bg-[#0F1D30]/50">
                <p className="text-[#8AB4CC] text-xs text-center">
                  🔥 <span className="text-white font-semibold">{lider.apelido}</span> lidera hoje com{' '}
                  <span className="text-[#FFD23F] font-bold">{lider.pontos} pts</span>
                </p>
              </div>
            )}
          </div>

          {/* Convidar mais */}
          <button
            onClick={compartilharWhatsApp}
            className="w-full flex items-center justify-center gap-2 bg-[#0F1D30] hover:bg-[#1A3A5C] text-white font-semibold py-3 rounded-xl text-sm transition-all active:scale-95"
          >
            <Share2 size={15} />
            Convidar mais amigos para a liga
          </button>

        </div>

        {/* Botão fixo — jogar ou ver placar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#070E1A]/95 backdrop-blur border-t border-[#1A3A5C] px-4 pt-3 pb-6">
          <div className="max-w-md mx-auto">
            {jaJogou ? (
              <div className="bg-[#0F1D30] rounded-2xl px-5 py-4 text-center">
                <p className="text-[#8AB4CC] text-sm font-semibold">✅ Você já jogou a rodada de hoje</p>
                <p className="text-[#5A8AAA] text-xs mt-1">Volte amanhã para a próxima rodada</p>
              </div>
            ) : (
              <button
                onClick={() => setJogando(true)}
                className="w-full bg-[#00C853] hover:bg-[#00E060] active:scale-95 text-[#0A1626] font-black text-xl py-5 rounded-2xl transition-all shadow-lg shadow-[#00C853]/20"
              >
                ⚽ Jogar Rodada de Hoje →
              </button>
            )}
          </div>
        </div>
      </main>
    )
  }

  // ── Sala expirada ────────────────────────────────────────────
  if (expirou) {
    return (
      <main className="min-h-screen bg-[#0A1626] text-white">
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl bg-[#0F1D30]"><ArrowLeft size={18} className="text-[#8AB4CC]" /></Link>
            <h1 className="text-xl font-black text-[#8AB4CC]">Sala {salaId} — Expirada</h1>
          </div>
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl p-6 text-center space-y-3">
            <p className="text-3xl">⏱️</p>
            <p className="text-white font-bold">Esta sala expirou</p>
            <p className="text-[#8AB4CC] text-sm">Salas duram 6 horas. Peça ao criador para abrir uma nova.</p>
          </div>
          {/* Mostra placar final mesmo com sala expirada */}
          {resultadosOrdenados.length > 0 && (
            <PlacardSala resultados={resultadosOrdenados} meuApelido={meuApelido} />
          )}
        </div>
      </main>
    )
  }

  // ── Jogo da rodada ───────────────────────────────────────────
  const rodadaIdSala = 2_000_000 + parseInt(salaId.replace(/[^0-9]/g, '0').slice(0, 6), 10)

  return (
    <main className="min-h-screen bg-[#0A1626] text-white">
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setJogando(false)}
            className="p-2 rounded-xl bg-[#0F1D30] hover:bg-[#1A3A5C] transition-all"
          >
            <ArrowLeft size={18} className="text-[#8AB4CC]" />
          </button>
          <div>
            <h1 className="text-base font-black text-[#00C853]">🏆 {sala.nome ?? salaId}</h1>
            <p className="text-[#8AB4CC] text-xs">Rodada de hoje</p>
          </div>
        </div>

        <JogoDesafio
          key={rodadaIdSala}
          jogador={jogador}
          rodadaId={rodadaIdSala}
          perfil={perfil}
          indiceDesafio={0}
          modoExtra={true}
          labelProximoDesafio="Ver placar da liga →"
          mensagemFimJogo="Voltando para a liga..."
          onResultado={p => setPerfil(p)}
          onContratosChange={() => {}}
          onProximoDesafio={() => setJogando(false)}
          onFimJogo={handleFimJogo}
        />
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
                ? 'bg-[#0F1D30] border border-[#1A3A5C]'
                : 'bg-[#0F1D30]'
            }`}
          >
            <div className={`w-9 text-center font-black text-sm flex-shrink-0 ${
              pos === 1 ? 'text-[#FFD23F] text-lg' :
              pos === 2 ? 'text-white text-base' :
              pos === 3 ? 'text-[#FFD23F] text-base' :
              'text-[#8AB4CC] text-sm'
            }`}>
              {medalha(pos)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm truncate ${souEu ? 'text-[#00C853]' : 'text-white'}`}>
                {r.apelido} {souEu && <span className="text-[#8AB4CC] text-xs">(você)</span>}
              </p>
              <p className="text-[#8AB4CC] text-xs">
                {acertou ? `Acertou na pista ${r.pista_acerto}` : 'Não acertou'}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`font-black text-base ${r.pontos > 0 ? 'text-[#FFD23F]' : 'text-[#8AB4CC]'}`}>
                {r.pontos > 0 ? `+${r.pontos}` : '0'}
              </p>
              <p className="text-[#5A8AAA] text-xs">pts</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
