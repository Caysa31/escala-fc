'use client'

import { useState, useRef, useEffect } from 'react'
import { buscarJogadores, verificarPalpite } from '@/lib/game'
import { Jogador } from '@/lib/types'
import { GameMode } from '@/lib/gameMode'
import { Send } from 'lucide-react'

interface InputPalpiteProps {
  onPalpite: (nome: string) => void
  desabilitado: boolean
  tentativasAnteriores: string[]
  mode?: GameMode
}

export default function InputPalpite({ onPalpite, desabilitado, tentativasAnteriores, mode = 'bola' }: InputPalpiteProps) {
  const [valor, setValor] = useState('')
  const [sugestoes, setSugestoes] = useState<Jogador[]>([])
  const [focado, setFocado] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Quando o teclado abre no celular, rola apenas o suficiente para o input
  // ficar acima do teclado — sem sobre-rolar e esconder a última pista.
  useEffect(() => {
    if (!focado || !inputRef.current) return
    const scroll = () => {
      if (!inputRef.current || !window.visualViewport) return
      const rect = inputRef.current.getBoundingClientRect()
      const vv = window.visualViewport
      const visibleBottom = vv.offsetTop + vv.height
      if (rect.bottom > visibleBottom - 8) {
        window.scrollBy({ top: rect.bottom - visibleBottom + 24, behavior: 'smooth' })
      }
    }
    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', scroll)
      return () => window.visualViewport?.removeEventListener('resize', scroll)
    }
    const t = setTimeout(scroll, 300)
    return () => clearTimeout(t)
  }, [focado])

  // Sem auto-foco: o jogador deve ler a intro e as pistas antes de digitar

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setValor(v)
    // Filtra jogadores já tentados, comparando por nome canônico OU por apelido
    // (ex: tentativa "Messi" deve suprimir "Lionel Messi" no autocomplete)
    const resultados = buscarJogadores(v, mode).filter(
      j => !tentativasAnteriores.some(t => verificarPalpite(t, j) || t === j.nome)
    )
    setSugestoes(resultados)
  }

  function handleSugestao(nome: string) {
    setValor('')
    setSugestoes([])
    onPalpite(nome)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valor.trim()) return
    const trimmed = valor.trim()
    setValor('')
    setSugestoes([])
    onPalpite(trimmed)
  }

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={valor}
            onChange={handleChange}
            onFocus={() => setFocado(true)}
            onBlur={() => setTimeout(() => setFocado(false), 150)}
            disabled={desabilitado}
            placeholder={desabilitado ? 'Rodada encerrada' : 'Digite o nome do jogador...'}
            className={`
              w-full rounded-xl px-4 py-3 text-base bg-[#0F1D30] border-2 text-white placeholder-[#2A4A6A]
              outline-none transition-all
              ${desabilitado
                ? 'border-[#1A3A5C] opacity-50 cursor-not-allowed'
                : 'border-[#1A3A5C] focus:border-[#00C853]'
              }
            `}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />

          {/* Dropdown de sugestões — absolute acima do input */}
          {focado && sugestoes.length > 0 && (
            <ul
              className="absolute left-0 right-0 z-[999] bg-[#0F1D30] border border-[#1A3A5C] rounded-xl overflow-hidden shadow-2xl max-h-56 overflow-y-auto"
              style={{ bottom: 'calc(100% + 6px)' }}
            >
              {sugestoes.map(j => (
                <li key={j.id}>
                  <button
                    type="button"
                    onMouseDown={() => handleSugestao(j.apelido ?? j.nome)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1A3A5C] transition-colors text-left border-b border-[#1A3A5C] last:border-0"
                  >
                    <span className="text-xl">{j.bandeira}</span>
                    <div>
                      <p className="font-semibold text-white text-sm">{j.apelido ?? j.nome}</p>
                      <p className="text-xs text-[#8AB4CC]">{j.posicao} · {j.clube}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={desabilitado || !valor.trim()}
          className={`
            flex-shrink-0 rounded-xl px-5 py-3 font-bold text-sm transition-all flex items-center gap-2
            ${desabilitado || !valor.trim()
              ? 'bg-[#1A3A5C] text-[#8AB4CC] cursor-not-allowed'
              : 'bg-[#00C853] hover:bg-[#00E060] text-[#0A1626]'
            }
          `}
        >
          <Send size={16} />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </form>
    </div>
  )
}
