'use client'

import { Tentativa } from '@/lib/types'
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react'

interface ListaTentativasProps {
  tentativas: Tentativa[]
}

export default function ListaTentativas({ tentativas }: ListaTentativasProps) {
  if (tentativas.length === 0) return null

  // Separa pulou das tentativas reais (erros e acertos)
  const puladas = tentativas.filter(t => t.nome === '—')
  const reais = tentativas.filter(t => t.nome !== '—')

  // Se só tem pulou e são 2+, mostra apenas badge compacto
  if (reais.length === 0 && puladas.length >= 2) {
    return (
      <div className="flex items-center gap-2 px-1">
        <ChevronRight size={14} className="text-[#5A8AAA]" />
        <span className="text-[#5A8AAA] text-xs">{puladas.length}× pulou</span>
      </div>
    )
  }

  return (
    <div className="w-full space-y-2">
      <p className="text-xs text-[#8AB4CC] uppercase tracking-wide font-medium">Tentativas</p>
      <div className="space-y-1">
        {/* Pulou compacto no topo se houver algum junto com tentativas reais */}
        {puladas.length > 0 && reais.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <ChevronRight size={14} className="text-[#5A8AAA]" />
            <span className="text-[#5A8AAA] text-xs">{puladas.length}× pulou</span>
          </div>
        )}
        {reais.map((t, i) => (
          <div
            key={i}
            className={`
              flex items-center gap-3 px-4 py-2 rounded-lg text-sm
              ${t.status === 'acerto'
                ? 'bg-[#071A0F] border border-[#00C853]/40 text-[#00C853]'
                : 'bg-red-950/40 border border-red-900/40 text-red-300'
              }
            `}
          >
            {t.status === 'acerto' ? (
              <CheckCircle size={16} className="text-[#00C853] flex-shrink-0" />
            ) : (
              <XCircle size={16} className="text-red-400 flex-shrink-0" />
            )}
            <span className="font-medium">{t.nome}</span>
            <span className="ml-auto text-xs opacity-60">
              {t.status === 'acerto' ? 'ACERTOU!' : 'errou'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
