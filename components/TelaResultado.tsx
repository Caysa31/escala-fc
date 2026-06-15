'use client'

import { useState } from 'react'
import { Jogador, Tentativa, MULTIPLICADORES_CONTRATO } from '@/lib/types'
import { gerarTextoCompartilhar } from '@/lib/game'
import { Check, Copy, Share2, X, Swords } from 'lucide-react'
import Image from 'next/image'

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

  // Asset 3D por pista de acerto
  const trofeuSrc = (() => {
    if (!ganhou) return null
    if (pistaAcerto === 0 || pistaAcerto === 1) return '/assets/trophy.png'
    if (pistaAcerto === 2) return '/assets/medal-gold.png'
    if (pistaAcerto === 3) return '/assets/medal-silver.png'
    return '/assets/medal-bronze.png'
  })()

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
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
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ text: texto }); return } catch { return }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-[#080D18] border border-[#1A2A40] rounded-2xl w-full max-w-sm p-5 space-y-4">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black tracking-wide text-white uppercase">
            {ganhou ? '🎯 Acertou!' : '😬 Não foi dessa vez'}
          </h2>
          <button onClick={onFechar} className="text-[#5A8AAA] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Asset 3D + jogador revelado */}
        <div className="bg-[#0A1220] border border-[#1A2A40] rounded-2xl p-4 text-center">
          {trofeuSrc ? (
            <div className="flex justify-center mb-2">
              <Image src={trofeuSrc} alt="troféu" width={80} height={80} className="object-contain drop-shadow-lg" style={{ filter: 'drop-shadow(0 4px 16px rgba(255,210,63,0.25))' }} />
            </div>
          ) : (
            <p className="text-4xl mb-2">😤</p>
          )}
          <p className="text-3xl mb-1">{jogador.bandeira}</p>
          <p className="text-2xl font-black text-white">{jogador.apelido ?? jogador.nome}</p>
          <p className="text-[#5A8AAA] text-sm mt-1">{jogador.posicao} · {jogador.clube}</p>
        </div>

        {/* Pontos */}
        {ganhou && (
          <div className="flex items-center gap-3 rounded-xl p-4" style={{ background: 'rgba(255,210,63,0.06)', border: '1px solid rgba(255,210,63,0.2)' }}>
            <div className="text-center flex-1">
              <p className="text-[#FFD23F] font-black text-3xl">+{pontos}</p>
              <p className="text-[#FFD23F] text-xs font-bold opacity-60">pontos</p>
            </div>
            <div className="w-px h-10 bg-[#1A2A40]" />
            <div className="text-center flex-1">
              <p className="text-white font-black text-sm">{pistaAcerto === 0 ? 'Histórico' : `Pista ${pistaAcerto}`}</p>
              <p className="text-[#5A8AAA] text-xs mt-0.5">{MULTIPLICADORES_CONTRATO[pistaAcerto!]}× mult.</p>
            </div>
          </div>
        )}

        {!ganhou && (
          <div className="bg-[#0A1220] border border-[#1A2A40] rounded-xl p-4 text-center">
            {onProximoDesafio
              ? <p className="text-white text-sm font-semibold">Próximo desafio te espera 👇</p>
              : <p className="text-[#5A8AAA] text-sm">Sem contrato hoje — tente amanhã! 🔄</p>
            }
          </div>
        )}

        {/* Grade de emojis */}
        <div className="bg-[#0A1220] border border-[#1A2A40] rounded-xl p-4">
          <p className="text-[#5A8AAA] text-xs mb-2 text-center uppercase tracking-widest font-bold">Cobra da Bola #{rodadaId}</p>
          <p className="text-2xl text-center tracking-widest">
            {tentativas.map(t => t.status === 'acerto' ? '🟩' : '⬛').join('')}
          </p>
          <p className="text-[#3A5570] text-xs text-center mt-2">cobra-craque.vercel.app</p>
        </div>

        {/* Botões de compartilhar */}
        <div className="flex gap-2">
          <button onClick={copiar}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm transition-all
              ${copiado ? 'text-[#0A1626]' : 'bg-[#0A1220] border border-[#1A2A40] hover:border-[#2A4A6A] text-white'}`}
            style={copiado ? { background: '#00C853' } : {}}
          >
            {copiado ? <Check size={16} /> : <Copy size={16} />}
            {copiado ? 'Copiado!' : 'Copiar'}
          </button>
          <button onClick={compartilharWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm text-[#0A1626] transition-all"
            style={{ background: '#00C853' }}
          >
            <Share2 size={16} />
            WhatsApp
          </button>
        </div>

        {onProximoDesafio && (
          <button onClick={() => { onFechar(); onProximoDesafio() }}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-4 font-black text-base text-[#0A1626] transition-all"
            style={{ background: '#00C853' }}
          >
            Próximo desafio →
          </button>
        )}

        <button
          onClick={() => {
            const t = tentativas.map(x => x.status === 'acerto' ? '1' : '0').join('')
            const p = pistaAcerto ?? 0
            const link = `${window.location.origin}/desafio/${rodadaId}?p=${p}&t=${t}`
            const msg = `Acertei o COBRA #${rodadaId}${pistaAcerto === 0 ? ' pelo histórico' : pistaAcerto ? ` na pista ${pistaAcerto}` : ''} — você consegue?\n${link}`
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
          }}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm bg-[#0A1220] border border-[#1A2A40] hover:border-[#2A4A6A] text-white transition-all"
        >
          <Swords size={16} />
          Desafiar amigo
        </button>

        {!onProximoDesafio && (
          <>
            <div className="bg-[#0A1220] border border-[#1A2A40] rounded-xl p-4 text-center space-y-1">
              <Image src="/assets/trophy.png" alt="troféu" width={48} height={48} className="mx-auto" />
              <p className="text-white font-bold text-sm">Desafios de hoje concluídos!</p>
              <p className="text-[#5A8AAA] text-xs">Novos desafios amanhã.</p>
            </div>
            <button onClick={onFechar}
              className="w-full text-center text-[#5A8AAA] hover:text-white text-sm font-semibold py-2 border border-[#1A2A40] rounded-xl transition-colors"
            >
              ← Voltar ao início
            </button>
          </>
        )}
      </div>
    </div>
  )
}
