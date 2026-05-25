'use client'

import { Lock } from 'lucide-react'

interface PistaProps {
  numero: number
  texto: string
  revelada: boolean
  atual: boolean
}

const LABELS_PISTAS = ['Posição', 'Primeira Letra', 'Nacionalidade', 'Idade', 'Clube']

export default function Pista({ numero, texto, revelada, atual }: PistaProps) {
  return (
    <div
      className={`
        rounded-xl border-2 p-4 transition-all duration-500
        ${revelada
          ? atual
            ? 'border-green-400 bg-green-950 shadow-lg shadow-green-900/30'
            : 'border-zinc-600 bg-zinc-800'
          : 'border-zinc-700 bg-zinc-900'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Número da pista */}
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
            ${revelada
              ? atual
                ? 'bg-green-400 text-black'
                : 'bg-zinc-600 text-white'
              : 'bg-zinc-800 text-zinc-500'
            }
          `}
        >
          {numero}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium mb-1 ${revelada ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {LABELS_PISTAS[numero - 1]}
          </p>
          {revelada ? (
            <p className={`font-semibold text-base leading-snug ${atual ? 'text-green-300' : 'text-white'}`}>
              {texto}
            </p>
          ) : (
            <div className="flex items-center gap-2 text-zinc-600">
              <Lock size={14} />
              <span className="text-sm">Bloqueada</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
