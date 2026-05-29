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
      <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Tentativas</p>
      <div className="space-y-1">
        {tentativas.map((t, i) => {
          const isPulou = t.nome === '—'
          return (
            <div
              key={i}
              className={`
                flex items-center gap-3 px-4 py-2 rounded-lg text-sm
                ${t.status === 'acerto'
                  ? 'bg-green-950 border border-green-700 text-green-300'
                  : isPulou
                    ? 'bg-zinc-800/60 border border-zinc-700 text-zinc-500'
                    : 'bg-red-950 border border-red-900 text-red-300'
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
