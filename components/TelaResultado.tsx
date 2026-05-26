'use client'

import { useState } from 'react'
import { Jogador, Tentativa, MULTIPLICADORES_CONTRATO } from '@/lib/types'
import { gerarTextoCompartilhar } from '@/lib/game'
import { Check, Copy, Share2, Trophy, X, Swords } from 'lucide-react'

interface TelaResultadoProps {
  jogador: Jogador
  rodadaId: number
  pistaAcerto: number | null
  pontos: number
  tentativas: Tentativa[]
  onFechar: () => void
  onProximoDesafio?: () => void
}

export default function TelaResultado({
  jogador,
  rodadaId,
  pistaAcerto,
  pontos,
  tentativas,
  onFechar,
  onProximoDesafio,
}: TelaResultadoProps) {
  const [copiado, setCopiado] = useState(false)
  const ganhou = pistaAcerto !== null
  const texto = gerarTextoCompartilhar(rodadaId, pistaAcerto, tentativas)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Fallback para dispositivos sem clipboard API
      const el = document.createElement('textarea')
      el.value = texto
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  function compartilharWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm p-6 space-y-5">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {ganhou ? '🎯 Acertou!' : '😬 Não foi dessa vez'}
          </h2>
          <button
            onClick={onFechar}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Jogador revelado */}
        <div className="bg-zinc-800 rounded-xl p-4 text-center">
          <p className="text-4xl mb-2">{jogador.bandeira}</p>
          <p className="text-2xl font-black text-white">{jogador.nome}</p>
          <p className="text-zinc-400 text-sm mt-1">{jogador.posicao} · {jogador.clube}</p>
        </div>

        {/* Pontos */}
        {ganhou && (
          <div className="flex items-center gap-3 bg-green-950 border border-green-800 rounded-xl p-4">
            <Trophy size={24} className="text-yellow-400" />
            <div>
              <p className="text-green-300 font-bold text-lg">+{pontos} pontos</p>
              <p className="text-green-600 text-xs">
                Pista {pistaAcerto} · Contrato assinado com multiplicador {MULTIPLICADORES_CONTRATO[pistaAcerto!]}×
              </p>
            </div>
          </div>
        )}

        {!ganhou && (
          <div className="bg-zinc-800 rounded-xl p-4 text-center">
            <p className="text-zinc-400 text-sm">Sem contrato hoje — tente amanhã! 🔄</p>
          </div>
        )}

        {/* Grade de emojis */}
        <div className="bg-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-xs mb-2 text-center">ESCALA FC #{rodadaId}</p>
          <p className="text-2xl text-center tracking-widest">
            {tentativas.map(t => t.status === 'acerto' ? '🟩' : '⬛').join('')}
          </p>
          <p className="text-zinc-500 text-xs text-center mt-2">escalafe.com.br</p>
        </div>

        {/* Botões de compartilhar */}
        <div className="flex gap-2">
          <button
            onClick={copiar}
            className={`
              flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm transition-all
              ${copiado
                ? 'bg-green-600 text-white'
                : 'bg-zinc-700 hover:bg-zinc-600 text-white'
              }
            `}
          >
            {copiado ? <Check size={16} /> : <Copy size={16} />}
            {copiado ? 'Copiado!' : 'Copiar'}
          </button>

          <button
            onClick={compartilharWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm bg-green-600 hover:bg-green-500 text-white transition-all"
          >
            <Share2 size={16} />
            WhatsApp
          </button>
        </div>

        {/* Próximo desafio (se houver) */}
        {onProximoDesafio && (
          <button
            onClick={() => { onFechar(); onProximoDesafio() }}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-base bg-green-600 hover:bg-green-500 text-white transition-all"
          >
            Próximo desafio →
          </button>
        )}

        {/* Desafiar amigo */}
        <button
          onClick={() => {
            const link = `${window.location.origin}/desafio/${rodadaId}`
            const msg = `Consegui acertar o ESCALA FC #${rodadaId}${pistaAcerto ? ` em ${pistaAcerto} pista${pistaAcerto > 1 ? 's' : ''}` : ''} — você consegue? ${link}`
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
          }}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm bg-zinc-700 hover:bg-zinc-600 text-white transition-all"
        >
          <Swords size={16} />
          Desafiar amigo
        </button>

        {/* Encerramento do dia — só mostra se não há próximo desafio */}
        {!onProximoDesafio && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-center space-y-1">
            <p className="text-2xl">🏆</p>
            <p className="text-white font-bold text-sm">Você completou os 3 desafios de hoje!</p>
            <p className="text-zinc-400 text-xs">Novos desafios amanhã à meia-noite.</p>
            <p className="text-zinc-500 text-xs mt-1">Ative as notificações para não perder 🔔</p>
          </div>
        )}
      </div>
    </div>
  )
}
