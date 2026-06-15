'use client'

import { useState } from 'react'

const SLIDES = [
  {
    emoji: '🔐',
    titulo: 'Leia as pistas',
    desc: 'Cada pista revela um detalhe do jogador — nome codificado, habilidade, origem e clube.',
    detalhe: 'Quanto menos pistas usar, mais pontos você ganha.',
  },
  {
    emoji: '⌨️',
    titulo: 'Digite o nome',
    desc: 'Chute o nome do jogador. O app completa automaticamente — sem precisar escrever tudo.',
    detalhe: 'Errou? A próxima pista é revelada automaticamente.',
  },
  {
    emoji: '🏆',
    titulo: 'Acerte cedo, ganhe mais',
    desc: 'Acertar na pista 1 vale 120 pts. Na pista 4 já vale só 20 pts.',
    detalhe: 'Há 5 desafios por dia. Volte amanhã para mais.',
  },
]

interface Props {
  onConcluir: () => void
  modeColor?: string
}

export default function TutorialOnboarding({ onConcluir, modeColor = '#00C853' }: Props) {
  const [slide, setSlide] = useState(0)
  const ultimo = slide === SLIDES.length - 1

  function avancar() {
    if (ultimo) { onConcluir(); return }
    setSlide(s => s + 1)
  }

  const s = SLIDES[slide]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#080D18', border: `1px solid ${modeColor}30` }}>

        {/* Indicadores de slide */}
        <div className="flex gap-1.5 p-4 pb-0 justify-center">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                background: i === slide ? modeColor : '#1A2A40',
                width: i === slide ? '24px' : '8px',
              }}
            />
          ))}
        </div>

        <div className="p-7 text-center space-y-4">
          <p className="text-6xl">{s.emoji}</p>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">{s.titulo}</h2>
            <p className="text-[#A0BDD0] text-sm leading-relaxed">{s.desc}</p>
            <p className="text-xs font-semibold" style={{ color: `${modeColor}99` }}>{s.detalhe}</p>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-2">
          <button
            onClick={avancar}
            className="w-full py-3.5 rounded-xl font-black text-sm transition-all active:scale-95 text-[#050810]"
            style={{ background: modeColor }}
          >
            {ultimo ? 'Começar a jogar →' : 'Próximo →'}
          </button>
          {!ultimo && (
            <button onClick={onConcluir} className="w-full text-center text-[#3A5570] text-xs py-2 font-semibold">
              Pular tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
