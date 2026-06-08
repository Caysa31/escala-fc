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

  async function compartilharWhatsApp() {
    // navigator.share abre o menu nativo do iOS/Android — usuário escolhe o app (WhatsApp, WA Business, Telegram…)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text: texto })
        return
      } catch {
        // Cancelou ou falhou — não faz nada
        return
      }
    }
    // Fallback: abre wa.me diretamente (Android sem Web Share API)
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0A1626] border border-[#1A3A5C] rounded-2xl w-full max-w-sm p-6 space-y-4">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {ganhou ? '🎯 Acertou!' : '😬 Não foi dessa vez'}
          </h2>
          <button onClick={onFechar} className="text-[#8AB4CC] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Jogador revelado */}
        <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-4 text-center">
          <p className="text-4xl mb-2">{jogador.bandeira}</p>
          <p className="text-2xl font-black text-white">{jogador.nome}</p>
          <p className="text-[#8AB4CC] text-sm mt-1">{jogador.posicao} · {jogador.clube}</p>
        </div>

        {/* Pontos */}
        {ganhou && (
          <div className="flex items-center gap-3 bg-[#071A0F] border border-[#00C853]/30 rounded-xl p-4">
            <Trophy size={24} className="text-[#FFD23F]" />
            <div>
              <p className="text-[#FFD23F] font-black text-2xl">+{pontos} pts</p>
              <p className="text-[#8AB4CC] text-xs mt-0.5">
                {pistaAcerto === 0 ? 'Histórico' : `Pista ${pistaAcerto}`} · multiplicador {MULTIPLICADORES_CONTRATO[pistaAcerto!]}×
              </p>
            </div>
          </div>
        )}

        {!ganhou && (
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-4 text-center">
            {onProximoDesafio ? (
              <>
                <p className="text-white text-sm font-semibold">Sem contrato nessa 😤</p>
                <p className="text-[#8AB4CC] text-xs mt-0.5">Próximo desafio te espera 👇</p>
              </>
            ) : (
              <p className="text-[#8AB4CC] text-sm">Sem contrato hoje — tente amanhã! 🔄</p>
            )}
          </div>
        )}

        {/* Grade de emojis */}
        <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-4">
          <p className="text-[#8AB4CC] text-xs mb-2 text-center">COBRA DA BOLA — Quem é o Craque? #{rodadaId}</p>
          <p className="text-2xl text-center tracking-widest">
            {tentativas.map(t => t.status === 'acerto' ? '🟩' : '⬛').join('')}
          </p>
          <p className="text-[#5A8AAA] text-xs text-center mt-2">cobra-craque.vercel.app</p>
        </div>

        {/* Botões de compartilhar */}
        <div className="flex gap-2">
          <button onClick={copiar}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm transition-all
              ${copiado ? 'bg-[#00C853] text-[#0A1626]' : 'bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 text-white'}`}
          >
            {copiado ? <Check size={16} /> : <Copy size={16} />}
            {copiado ? 'Copiado!' : 'Copiar'}
          </button>
          <button onClick={compartilharWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm bg-[#00C853] hover:bg-[#00E060] text-[#0A1626] transition-all">
            <Share2 size={16} />
            WhatsApp
          </button>
        </div>

        {/* Próximo desafio */}
        {onProximoDesafio && (
          <button onClick={() => { onFechar(); onProximoDesafio() }}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-base bg-[#00C853] hover:bg-[#00E060] text-[#0A1626] transition-all">
            Próximo desafio →
          </button>
        )}

        {/* Desafiar amigo */}
        <button
          onClick={() => {
            const t = tentativas.map(x => x.status === 'acerto' ? '1' : '0').join('')
            const p = pistaAcerto ?? 0
            const link = `${window.location.origin}/desafio/${rodadaId}?p=${p}&t=${t}`
            const msg = `Acertei o COBRA #${rodadaId}${pistaAcerto === 0 ? ' pelo histórico' : pistaAcerto ? ` na pista ${pistaAcerto}` : ''} — você consegue?\n${link}`
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
          }}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 text-white transition-all"
        >
          <Swords size={16} />
          Desafiar amigo
        </button>

        {/* Encerramento do dia */}
        {!onProximoDesafio && (
          <>
            <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-4 text-center space-y-1">
              <p className="text-2xl">🏆</p>
              <p className="text-white font-bold text-sm">Você completou os desafios de hoje!</p>
              <p className="text-[#8AB4CC] text-xs">Novos desafios amanhã.</p>
            </div>
            <button
              onClick={onFechar}
              className="w-full text-center text-[#8AB4CC] hover:text-white text-sm font-semibold py-2 border border-[#1A3A5C] rounded-xl transition-colors"
            >
              ← Voltar ao início
            </button>
          </>
        )}
      </div>
    </div>
  )
}
