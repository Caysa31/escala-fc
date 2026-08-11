'use client'

import { useState, useCallback } from 'react'
import { Questao, TipoModo, gerarSessao } from '@/lib/geradorQuestoes'
import CardJogador from './CardJogador'

const TOTAL_QUESTOES = 10
const PONTOS_POR_ACERTO = 100
const TEMPO_FEEDBACK = 1600 // ms antes de passar para próxima

type EstadoCard = 'idle' | 'correto' | 'errado' | 'revelado'
type FaseJogo = 'jogando' | 'feedback' | 'fim'

interface Props {
  tipo: TipoModo
  onVoltar: () => void
}

export default function JogoExtra({ tipo, onVoltar }: Props) {
  const [sessao] = useState<Questao[]>(() => gerarSessao(tipo, TOTAL_QUESTOES))
  const [atual, setAtual] = useState(0)
  const [pontos, setPontos] = useState(0)
  const [acertos, setAcertos] = useState(0)
  const [fase, setFase] = useState<FaseJogo>('jogando')
  const [estadoCards, setEstadoCards] = useState<EstadoCard[]>(['idle','idle','idle','idle'])
  const [respostaCerta, setRespostaCerta] = useState(false)

  const questao = sessao[atual]
  const progresso = Math.round((atual / TOTAL_QUESTOES) * 100)
  const modoLabel = tipo === 'quem-nao-pertence' ? 'QUEM NÃO PERTENCE?' : 'ELIMINE 1 DOS 4'

  const responder = useCallback((idxCard: number) => {
    if (fase !== 'jogando') return
    const jogadorClicado = questao.jogadores[idxCard]
    const acertou = jogadorClicado.id === questao.intrusoId

    const novoEstado: EstadoCard[] = questao.jogadores.map((j, i) => {
      if (i === idxCard) return acertou ? 'correto' : 'errado'
      if (j.id === questao.intrusoId) return 'revelado'
      return 'idle'
    })

    setEstadoCards(novoEstado)
    setFase('feedback')
    setRespostaCerta(acertou)
    if (acertou) {
      setPontos(p => p + PONTOS_POR_ACERTO)
      setAcertos(a => a + 1)
    }

    setTimeout(() => {
      if (atual + 1 >= TOTAL_QUESTOES) {
        setFase('fim')
      } else {
        setAtual(a => a + 1)
        setEstadoCards(['idle','idle','idle','idle'])
        setFase('jogando')
      }
    }, TEMPO_FEEDBACK)
  }, [fase, questao, atual])

  // ── Tela de fim ───────────────────────────────────────────────
  if (fase === 'fim') {
    const pct = Math.round((acertos / TOTAL_QUESTOES) * 100)
    const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🥇' : pct >= 50 ? '🥈' : '⚽'
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-5 text-center">
        <div className="mb-6 text-8xl">{emoji}</div>
        <h2 className="text-3xl font-black text-white mb-1">Fim de Jogo!</h2>
        <p className="text-white/50 mb-8 text-sm">{modoLabel}</p>

        <div className="bg-white/8 border border-white/15 rounded-3xl p-8 w-full max-w-xs mb-8">
          <div className="text-5xl font-black text-[#00C853] mb-1">{pontos}</div>
          <div className="text-white/50 text-sm mb-5">pontos</div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-black text-white">{acertos}/{TOTAL_QUESTOES}</div>
              <div className="text-white/40 text-xs">acertos</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">{pct}%</div>
              <div className="text-white/40 text-xs">aproveitamento</div>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full max-w-xs bg-[#00C853] text-black font-black py-4 rounded-2xl text-lg mb-3"
        >
          Jogar de Novo
        </button>
        <button
          onClick={onVoltar}
          className="text-white/40 text-sm py-2"
        >
          Voltar ao menu
        </button>
      </div>
    )
  }

  // ── Jogo ──────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col bg-[#09090b]"
      style={{
        backgroundImage: 'url(/assets/estadio-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay escuro */}
      <div className="fixed inset-0 bg-black/70" />

      <div className="relative z-10 flex flex-col flex-1 px-4 pt-safe-top pb-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-4 pb-3">
          <button onClick={onVoltar} className="text-white/60 text-2xl w-10 h-10 flex items-center justify-center">
            ‹
          </button>
          <div className="text-center flex-1">
            <div className="text-[11px] font-bold text-white/40 tracking-widest uppercase">{modoLabel}</div>
            <div className="text-white font-black text-base">
              Questão {atual + 1}<span className="text-white/30">/{TOTAL_QUESTOES}</span>
            </div>
          </div>
          <div className="w-10 text-right">
            <div className="text-[#00C853] font-black text-sm">{pontos}</div>
            <div className="text-white/30 text-[9px]">pts</div>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="w-full h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-[#00C853] rounded-full transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>

        {/* Categoria (só no modo elimine) */}
        {tipo === 'elimine-1' && (
          <div className="bg-[#FFD23F]/15 border border-[#FFD23F]/30 rounded-2xl px-4 py-3 mb-4 text-center">
            <div className="text-[10px] text-[#FFD23F]/70 font-bold tracking-widest mb-0.5">CATEGORIA</div>
            <div className="text-[#FFD23F] font-black text-base">{questao.categoriaLabel}</div>
          </div>
        )}

        {/* Pergunta contextual */}
        <div className="bg-white/8 border border-white/12 rounded-2xl px-4 py-3 mb-4 text-center">
          <p className="text-white font-bold text-[15px] leading-snug">{questao.questaoTexto}</p>
        </div>

        {/* Grid 2×2 */}
        <div className="grid grid-cols-2 gap-3 flex-1">
          {questao.jogadores.map((jogador, i) => (
            <CardJogador
              key={`${questao.intrusoId}-${jogador.id}-${atual}`}
              jogador={jogador}
              estado={estadoCards[i]}
              onClick={() => responder(i)}
              disabled={fase !== 'jogando'}
              esconderPosicao={tipo === 'quem-nao-pertence'}
              esconderClube={questao.esconderClube}
            />
          ))}
        </div>

        {/* Feedback após resposta */}
        {fase === 'feedback' && (
          <div className={`
            mt-4 rounded-2xl px-4 py-3 text-center border
            ${respostaCerta
              ? 'bg-[#00C853]/15 border-[#00C853]/30 text-[#00C853]'
              : 'bg-red-500/15 border-red-500/30 text-red-400'
            }
          `}>
            <div className="font-black text-base mb-0.5">
              {respostaCerta ? '✓ Correto! +100 pts' : '✗ Errado'}
            </div>
            <div className="text-[11px] opacity-80 leading-snug">{questao.explicacao}</div>
          </div>
        )}
      </div>
    </div>
  )
}
