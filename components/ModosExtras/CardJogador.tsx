'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Jogador } from '@/lib/types'

interface Props {
  jogador: Jogador
  estado: 'idle' | 'correto' | 'errado' | 'revelado'
  onClick: () => void
  disabled?: boolean
  /** Esconde a posição no rodapé do card */
  esconderPosicao?: boolean
  /** Esconde o nome do clube na foto (evita entregar a resposta em questões de liga/título) */
  esconderClube?: boolean
}

// Cor de fundo por inicial do nome (determinístico)
const AVATAR_CORES = [
  '#1a6b3a', '#c0392b', '#1a4a8a', '#7b2d8b',
  '#c07000', '#1a7a7a', '#3d3d3d', '#8a4a1a',
]
function corAvatar(nome: string): string {
  let hash = 0
  for (const c of nome) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_CORES[Math.abs(hash) % AVATAR_CORES.length]
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export default function CardJogador({ jogador, estado, onClick, disabled, esconderPosicao, esconderClube }: Props) {
  const [fotoOk, setFotoOk] = useState(true)

  const borderClass =
    estado === 'correto'  ? 'border-[#00C853] shadow-[0_0_16px_#00C853aa]' :
    estado === 'errado'   ? 'border-red-500 shadow-[0_0_16px_#ef4444aa]' :
    estado === 'revelado' ? 'border-[#FFD23F] shadow-[0_0_12px_#FFD23Faa]' :
    'border-white/15 hover:border-white/40'

  const scaleClass =
    estado === 'correto' ? 'scale-105' :
    estado === 'errado'  ? 'scale-95 opacity-60' :
    'hover:scale-[1.03] active:scale-[0.97]'

  const animClass =
    estado === 'correto' ? 'animate-card-correct' :
    estado === 'errado'  ? 'animate-card-wrong' : ''

  const fotoSrc = `/jogadores-fotos/${jogador.id}.jpg`

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col overflow-hidden rounded-2xl border-2
        bg-black/40 backdrop-blur-md
        transition-all duration-200
        ${borderClass} ${scaleClass} ${animClass}
        ${disabled ? 'cursor-default' : 'cursor-pointer'}
        w-full aspect-[3/4]
      `}
    >
      {/* Foto ou avatar */}
      <div className="relative flex-1 w-full overflow-hidden bg-gradient-to-b from-white/5 to-black/30">
        {fotoOk ? (
          <Image
            src={fotoSrc}
            alt={jogador.nome}
            fill
            className="object-cover object-top"
            onError={() => setFotoOk(false)}
            unoptimized
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white/90"
            style={{ background: `linear-gradient(135deg, ${corAvatar(jogador.nome)}, ${corAvatar(jogador.nome)}99)` }}
          >
            {iniciais(jogador.nome)}
          </div>
        )}

        {/* Gradiente inferior sobre a foto */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Bandeira + clube sobrepostos */}
        <div className="absolute bottom-1 left-2 right-2 flex items-end justify-between">
          {!esconderClube && (
            <span className="text-[11px] font-semibold text-white/80 leading-tight line-clamp-1">
              {jogador.clube}
            </span>
          )}
          <span className={`text-lg leading-none ${esconderClube ? 'ml-auto' : ''}`}>{jogador.bandeira}</span>
        </div>
      </div>

      {/* Nome */}
      <div className="px-2 py-2 text-center">
        <p className="text-[13px] font-bold text-white leading-tight line-clamp-2">
          {jogador.nome}
        </p>
        {!esconderPosicao && (
          <p className="text-[10px] text-white/50 mt-0.5">{jogador.posicao}</p>
        )}
      </div>

      {/* Overlay check/X */}
      {(estado === 'correto' || estado === 'errado') && (
        <div className={`
          absolute inset-0 flex items-center justify-center
          rounded-2xl text-4xl font-black
          ${estado === 'correto' ? 'bg-[#00C853]/20' : 'bg-red-500/20'}
        `}>
          <span className="drop-shadow-lg">
            {estado === 'correto' ? '✓' : '✗'}
          </span>
        </div>
      )}
    </button>
  )
}
