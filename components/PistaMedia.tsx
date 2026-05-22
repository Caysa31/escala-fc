'use client'

import { useState } from 'react'
import { Jogador, TipoPista } from '@/lib/types'
import { getEscudo, CORES_CLUBE } from '@/lib/crests'
import { Lock, Clapperboard, Image as ImageIcon, Shield } from 'lucide-react'

interface PistaMediaProps {
  numero: number
  tipo: TipoPista
  jogador: Jogador
  revelada: boolean
  atual: boolean
}

export default function PistaMedia({ numero, tipo, jogador, revelada, atual }: PistaMediaProps) {
  return (
    <div
      className={`
        rounded-xl border-2 overflow-hidden transition-all duration-500
        ${revelada
          ? atual
            ? 'border-green-400 shadow-lg shadow-green-900/30'
            : 'border-zinc-600'
          : 'border-zinc-700 bg-zinc-900'
        }
      `}
    >
      {revelada ? (
        <ConteudoMidia tipo={tipo} jogador={jogador} atual={atual} numero={numero} />
      ) : (
        <PistaLocked numero={numero} tipo={tipo} />
      )}
    </div>
  )
}

// ── Pista bloqueada ───────────────────────────────────────────

function PistaLocked({ numero, tipo }: { numero: number; tipo: TipoPista }) {
  const icone = tipo === 'video'
    ? <Clapperboard size={18} className="text-zinc-600" />
    : tipo === 'imagem'
    ? <ImageIcon size={18} className="text-zinc-600" />
    : <Shield size={18} className="text-zinc-600" />

  const label = tipo === 'video' ? 'Silhueta' : tipo === 'imagem' ? 'Foto' : 'Escudo'

  return (
    <div className="flex items-center gap-3 px-4 py-4 bg-zinc-900">
      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-500">
        {numero}
      </div>
      <div className="flex items-center gap-2 text-zinc-600">
        <Lock size={14} />
        <span className="text-sm">{label} — Bloqueada</span>
      </div>
    </div>
  )
}

// ── Conteúdo revelado ─────────────────────────────────────────

function ConteudoMidia({
  tipo,
  jogador,
  atual,
  numero,
}: {
  tipo: TipoPista
  jogador: Jogador
  atual: boolean
  numero: number
}) {
  if (tipo === 'video') return <PistaSilhueta jogador={jogador} atual={atual} numero={numero} />
  if (tipo === 'imagem') return <PistaFoto jogador={jogador} atual={atual} numero={numero} />
  if (tipo === 'escudo') return <PistaEscudo jogador={jogador} atual={atual} numero={numero} />
  return null
}

// ── Pista 1: Silhueta ─────────────────────────────────────────

function PistaSilhueta({ jogador, atual, numero }: { jogador: Jogador; atual: boolean; numero: number }) {
  if (jogador.silhuetaUrl) {
    return (
      <div className={`bg-white relative ${atual ? '' : 'opacity-90'}`}>
        <div className="absolute top-2 left-2 z-10">
          <PistaTag numero={numero} label="Silhueta" atual={atual} />
        </div>
        <video
          src={jogador.silhuetaUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full aspect-video object-cover"
        />
      </div>
    )
  }

  // Placeholder — pipeline ainda não rodou para este jogador
  return (
    <div className={`bg-zinc-900 ${atual ? 'bg-green-950' : ''}`}>
      <div className="flex items-center gap-3 px-4 py-5">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
          ${atual ? 'bg-green-400 text-black' : 'bg-zinc-700 text-white'}`}>
          {numero}
        </div>
        <div>
          <p className="text-xs text-zinc-400 mb-1">Silhueta</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🕵️</span>
            <div>
              <p className={`font-bold text-sm ${atual ? 'text-green-300' : 'text-zinc-300'}`}>
                Vídeo em processamento
              </p>
              <p className="text-xs text-zinc-500">Pipeline YOLO11 ainda não rodou</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Pista 2: Foto com blur ────────────────────────────────────

function PistaFoto({ jogador, atual, numero }: { jogador: Jogador; atual: boolean; numero: number }) {
  const [erro, setErro] = useState(false)

  if (jogador.fotoBlurUrl && !erro) {
    return (
      <div className="relative">
        <div className="absolute top-2 left-2 z-10">
          <PistaTag numero={numero} label="Foto" atual={atual} />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={jogador.fotoBlurUrl}
          alt="Foto borrada do jogador"
          onError={() => setErro(true)}
          className="w-full aspect-video object-cover"
          style={{ filter: 'blur(12px)', transform: 'scale(1.05)' }}
        />
      </div>
    )
  }

  // Placeholder
  return (
    <div className={`bg-zinc-900 ${atual ? 'bg-green-950' : ''}`}>
      <div className="flex items-center gap-3 px-4 py-5">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
          ${atual ? 'bg-green-400 text-black' : 'bg-zinc-700 text-white'}`}>
          {numero}
        </div>
        <div>
          <p className="text-xs text-zinc-400 mb-1">Foto</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl">📷</span>
            <div>
              <p className={`font-bold text-sm ${atual ? 'text-green-300' : 'text-zinc-300'}`}>
                Foto em processamento
              </p>
              <p className="text-xs text-zinc-500">Pipeline de imagens ainda não rodou</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Pista 3: Escudo ───────────────────────────────────────────

function PistaEscudo({ jogador, atual, numero }: { jogador: Jogador; atual: boolean; numero: number }) {
  const [erro, setErro] = useState(false)
  const escudoUrl = getEscudo(jogador.clube)
  const cores = CORES_CLUBE[jogador.clube]

  return (
    <div className={`flex items-center gap-4 px-4 py-5 ${atual ? 'bg-green-950' : 'bg-zinc-900'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
        ${atual ? 'bg-green-400 text-black' : 'bg-zinc-700 text-white'}`}>
        {numero}
      </div>

      <div className="flex items-center gap-4">
        {/* Escudo */}
        {escudoUrl && !erro ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={escudoUrl}
            alt="Escudo do clube"
            onError={() => setErro(true)}
            className="w-16 h-16 object-contain"
          />
        ) : (
          // Fallback: badge com cores do clube
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center font-black text-lg shadow-md"
            style={{
              backgroundColor: cores?.bg ?? '#333',
              color: cores?.text ?? '#fff',
            }}
          >
            {cores?.abrev ?? jogador.clube.slice(0, 3).toUpperCase()}
          </div>
        )}

        <div>
          <p className="text-xs text-zinc-400 mb-1">Escudo do Clube</p>
          <p className={`font-bold text-base ${atual ? 'text-green-300' : 'text-white'}`}>
            ???
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Descubra qual é o clube</p>
        </div>
      </div>
    </div>
  )
}

// ── Tag de número/label ───────────────────────────────────────

function PistaTag({ numero, label, atual }: { numero: number; label: string; atual: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold
      ${atual ? 'bg-green-500 text-black' : 'bg-black/60 text-white backdrop-blur-sm'}`}>
      <span>{numero}</span>
      <span>{label}</span>
    </div>
  )
}
