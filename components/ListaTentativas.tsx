'use client'

import { Tentativa } from '@/lib/types'
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react'

interface ListaTentativasProps {
  tentativas: Tentativa[]
}

export default function ListaTentativas({ tentativas }: ListaTentativasProps) {
  if (tentativas.length === 0) return null

  return (
    <div className="w-full space-y-2">
      <p className="text-xs text-[#8AB4CC] uppercase tracking-wide font-medium">Tentativas</p>
      <div className="space-y-1">
        {tentativas.map((t, i) => {
          const isPulou = t.nome === '—'
          return (
            <div
              key={i}
              className={`
                flex items-center gap-3 px-4 py-2 rounded-lg text-sm
                ${t.status === 'acerto'
                  ? 'bg-[#071A0F] border border-[#00C853]/40 text-[#00C853]'
                  : isPulou
                    ? 'bg-[#0F1D30] border border-[#1A3A5C] text-[#8AB4CC]'
                    : 'bg-red-950/40 border border-red-900/40 text-red-300'
                }
              `}
            >
              {t.status === 'acerto' ? (
                <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
              ) : isPulou ? (
                <ChevronRight size={16} className="text-zinc-600 flex-shrink-0" />
              ) : (
                <XCircle size={16} className="text-red-400 flex-shrink-0" />
              )}
              <span className="font-medium">{isPulou ? 'Pulou' : t.nome}</span>
              <span className="ml-auto text-xs opacity-60">
                {t.status === 'acerto' ? 'ACERTOU!' : isPulou ? 'próxima dica' : 'errou'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
