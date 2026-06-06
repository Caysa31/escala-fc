'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getPerguntasAleatorias, PONTOS_TRIVIA, Pergunta } from '@/lib/trivia'
import BottomNav from '@/components/BottomNav'

const TOTAL_PERGUNTAS = 10

type Estado = 'jogando' | 'respondida' | 'fim'

export default function CobraSabePage() {
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [idx, setIdx] = useState(0)
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null)
  const [pontos, setPontos] = useState(0)
  const [estado, setEstado] = useState<Estado>('jogando')
  const [acertos, setAcertos] = useState(0)

  const iniciar = useCallback(() => {
    setPerguntas(getPerguntasAleatorias(TOTAL_PERGUNTAS))
    setIdx(0)
    setRespostaSelecionada(null)
    setPontos(0)
    setEstado('jogando')
    setAcertos(0)
  }, [])

  useEffect(() => { iniciar() }, [iniciar])

  const perguntaAtual = perguntas[idx]

  function responder(opcaoIdx: number) {
    if (estado !== 'jogando' || !perguntaAtual) return
    setRespostaSelecionada(opcaoIdx)
    setEstado('respondida')
    const acertou = opcaoIdx === perguntaAtual.correta
    if (acertou) {
      setPontos(p => p + PONTOS_TRIVIA[perguntaAtual.dificuldade])
      setAcertos(a => a + 1)
    }
  }

  function proxima() {
    if (idx + 1 >= TOTAL_PERGUNTAS) {
      setEstado('fim')
    } else {
      setIdx(i => i + 1)
      setRespostaSelecionada(null)
      setEstado('jogando')
    }
  }

  if (!perguntaAtual && estado !== 'fim') {
    return (
      <div className="min-h-screen bg-[#0A1626] flex items-center justify-center">
        <div className="text-[#8AB4CC] animate-pulse">Carregando...</div>
      </div>
    )
  }

  // ── TELA DE FIM ───────────────────────────────────────────
  if (estado === 'fim') {
    const nota = acertos >= 9 ? '🐍 Cobra Suprema!' : acertos >= 7 ? '🔥 Muito bom!' : acertos >= 5 ? '⚡ Passou!' : '😅 Treina mais...'
    const cor = acertos >= 7 ? 'text-[#00C853]' : acertos >= 5 ? 'text-[#FFD23F]' : 'text-red-400'

    return (
      <div className="min-h-screen bg-[#0A1626] text-white flex flex-col items-center justify-center px-6 pb-28">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="text-7xl">{acertos >= 7 ? '🏆' : acertos >= 5 ? '🎯' : '📚'}</div>

          <div className="space-y-1">
            <p className={`text-3xl font-black ${cor}`}>{nota}</p>
            <p className="text-[#8AB4CC] text-sm">Quiz finalizado!</p>
          </div>

          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl py-6 px-4 space-y-4">
            <div>
              <p className="text-[#8AB4CC] text-xs uppercase tracking-wider">Acertos</p>
              <p className="text-white font-black text-5xl mt-1">{acertos}<span className="text-[#5A8AAA] text-2xl">/{TOTAL_PERGUNTAS}</span></p>
            </div>
            <div className="h-px bg-[#1A3A5C]" />
            <div>
              <p className="text-[#8AB4CC] text-xs uppercase tracking-wider">Pontos conquistados</p>
              <p className="text-[#FFD23F] font-black text-4xl mt-1">+{pontos}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={iniciar}
              className="w-full bg-[#00C853] hover:bg-[#00E060] active:scale-95 text-[#0A1626] font-black text-lg py-4 rounded-2xl transition-all"
            >
              Jogar Novamente →
            </button>
            <Link href="/modos" className="block w-full text-[#8AB4CC] font-semibold text-sm py-3 text-center">
              ← Voltar aos Modos
            </Link>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  // ── JOGO ──────────────────────────────────────────────────
  const progresso = ((idx) / TOTAL_PERGUNTAS) * 100

  return (
    <main className="min-h-screen bg-[#0A1626] text-white">
      <div className="max-w-md mx-auto px-4 pt-5 pb-28 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/modos" className="p-2 rounded-xl bg-[#0F1D30] border border-[#1A3A5C] shrink-0">
            <ArrowLeft size={18} className="text-[#8AB4CC]" />
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-black tracking-tight text-[#00C853]">🐍 Só Cobra Sabe</h1>
            <p className="text-[#8AB4CC] text-xs mt-0.5">História da Copa do Mundo</p>
          </div>
          <div className="w-9 shrink-0" />
        </div>

        {/* Progresso */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-[#8AB4CC]">
            <span>Pergunta {idx + 1} de {TOTAL_PERGUNTAS}</span>
            <span className="text-[#FFD23F] font-bold">{pontos} pts</span>
          </div>
          <div className="w-full bg-[#0F1D30] rounded-full h-2">
            <div
              className="bg-[#00C853] h-2 rounded-full transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        {/* Badge de dificuldade */}
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
            perguntaAtual.dificuldade === 'facil'
              ? 'text-[#00C853] border-[#00C853]/30 bg-[#00C853]/10'
              : perguntaAtual.dificuldade === 'medio'
                ? 'text-[#FFD23F] border-[#FFD23F]/30 bg-[#FFD23F]/10'
                : 'text-red-400 border-red-900/30 bg-red-900/10'
          }`}>
            {perguntaAtual.dificuldade === 'facil' ? `+${PONTOS_TRIVIA.facil} pts` : perguntaAtual.dificuldade === 'medio' ? `+${PONTOS_TRIVIA.medio} pts` : `+${PONTOS_TRIVIA.dificil} pts`}
          </span>
          <span className="text-[#5A8AAA] text-[10px]">
            {{artilheiros:'⚽ Artilheiros', campeoes:'🏆 Campeões', historia:'📖 História', recordes:'📊 Recordes', lendas:'⭐ Lendas', sedes:'🌍 Sedes'}[perguntaAtual.categoria]}
          </span>
        </div>

        {/* Pergunta */}
        <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl px-5 py-6">
          <p className="text-white font-bold text-lg leading-snug">{perguntaAtual.pergunta}</p>
        </div>

        {/* Opções */}
        <div className="space-y-2">
          {perguntaAtual.opcoes.map((opcao, i) => {
            let estilo = 'bg-[#0F1D30] border-[#1A3A5C] text-white hover:border-[#2A5275]'

            if (estado === 'respondida') {
              if (i === perguntaAtual.correta) {
                estilo = 'bg-[#071A0F] border-[#00C853] text-[#00C853]'
              } else if (i === respostaSelecionada) {
                estilo = 'bg-[#1A0505] border-red-900 text-red-400'
              } else {
                estilo = 'bg-[#0F1D30] border-[#1A3A5C] text-[#5A8AAA] opacity-50'
              }
            }

            return (
              <button
                key={i}
                onClick={() => responder(i)}
                disabled={estado === 'respondida'}
                className={`w-full text-left border rounded-xl px-4 py-4 text-sm font-semibold transition-all active:scale-[0.98] ${estilo}`}
              >
                <span className="text-[#5A8AAA] mr-2 text-xs">{String.fromCharCode(65 + i)}.</span>
                {opcao}
              </button>
            )
          })}
        </div>

        {/* Explicação após resposta */}
        {estado === 'respondida' && (
          <div className={`rounded-xl px-4 py-3 border ${respostaSelecionada === perguntaAtual.correta ? 'bg-[#071A0F] border-[#00C853]/30' : 'bg-[#1A0505] border-red-900/30'}`}>
            <p className={`text-xs font-bold mb-1 ${respostaSelecionada === perguntaAtual.correta ? 'text-[#00C853]' : 'text-red-400'}`}>
              {respostaSelecionada === perguntaAtual.correta ? '✅ Correto!' : '❌ Errou!'}
            </p>
            <p className="text-[#8AB4CC] text-xs leading-relaxed">{perguntaAtual.explicacao}</p>
          </div>
        )}

        {/* Botão próxima */}
        {estado === 'respondida' && (
          <button
            onClick={proxima}
            className="w-full bg-[#00C853] hover:bg-[#00E060] active:scale-95 text-[#0A1626] font-black text-base py-4 rounded-2xl transition-all"
          >
            {idx + 1 >= TOTAL_PERGUNTAS ? 'Ver Resultado 🏆' : 'Próxima →'}
          </button>
        )}

      </div>
      <BottomNav />
    </main>
  )
}
