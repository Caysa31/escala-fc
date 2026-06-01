'use client'

import { useState, useRef, useEffect } from 'react'
import { buscarJogadores } from '@/lib/game'
import { Jogador } from '@/lib/types'
import { Send } from 'lucide-react'

interface InputPalpiteProps {
  onPalpite: (nome: string) => void
  desabilitado: boolean
  tentativasAnteriores: string[]
}

export default function InputPalpite({ onPalpite, desabilitado, tentativasAnteriores }: InputPalpiteProps) {
  const [valor, setValor] = useState('')
  const [sugestoes, setSugestoes] = useState<Jogador[]>([])
  const [focado, setFocado] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sem auto-foco: o jogador deve ler a intro e as pistas antes de digitar

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setValor(v)
    const resultados = buscarJogadores(v).filter(
      j => !tentativasAnteriores.includes(j.nome)
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
              w-full rounded-xl px-4 py-3 text-base bg-zinc-800 border-2 text-white placeholder-zinc-500
              outline-none transition-all
              ${desabilitado
                ? 'border-zinc-700 opacity-50 cursor-not-allowed'
                : 'border-zinc-600 focus:border-green-400'
              }
            `}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />

          {/* Dropdown de sugestões — fixed no viewport, acima do teclado.
              Usa fixed em vez de absolute para escapar do stacking context
              do elemento pai (fixed z-40), que bloqueava a visibilidade. */}
          {focado && sugestoes.length > 0 && (
            <ul
              className="fixed left-4 right-4 z-[999] bg-zinc-800 border border-zinc-600 rounded-xl overflow-hidden shadow-2xl max-h-56 overflow-y-auto"
              style={{ bottom: 'calc(max(88px, 88px + env(safe-area-inset-bottom)))' }}
            >
              {sugestoes.map(j => (
                <li key={j.id}>
                  <button
                    type="button"
                    onMouseDown={() => handleSugestao(j.nome)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-700 transition-colors text-left"
                  >
                    <span className="text-xl">{j.bandeira}</span>
                    <div>
                      <p className="font-semibold text-white text-sm">{j.nome}</p>
                      <p className="text-xs text-zinc-400">{j.posicao} · {j.clube}</p>
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
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-400 text-black'
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
